import * as graphql from 'graphql';
import { Schema, InputType, OutputType, AllType } from './define';

export function buildGraphQLSchema<Ctx>(schema: Schema<Ctx>): graphql.GraphQLSchema {
  return new graphql.GraphQLSchema({
    query: toGraphQOutputType<Ctx>(schema.query, new Map()) as graphql.GraphQLObjectType,
  });
}

export function toGraphQLInputType<Ctx>(
  t: InputType<any>,
  typeMap: Map<AllType<Ctx>, graphql.GraphQLType>
): graphql.GraphQLInputType {
  const found = typeMap.get(t);

  if (found) {
    return typeMap.get(t) as graphql.GraphQLInputType;
  }

  switch (t.kind) {
    case 'Scalar':
    case 'Enum':
      return toGraphQOutputType(t, typeMap) as graphql.GraphQLInputType;
    case 'NonNull':
      return new graphql.GraphQLNonNull(toGraphQLInputType(t.ofType, typeMap));
    case 'List':
      return new graphql.GraphQLList(toGraphQLInputType(t.ofType, typeMap));
    case 'InputObject':
      const fields = t.fieldsFn();

      function graphqlFields() {
        const gqlFieldConfig: graphql.GraphQLInputFieldConfigMap = {};
  
        Object.keys(fields).forEach(k => {
          const field = (fields as any)[k];
          gqlFieldConfig[k] = {
            type: toGraphQLInputType(field.type, typeMap),
            description: field.description,
          } as graphql.GraphQLInputFieldConfig;
        });

        return gqlFieldConfig
      }
      
      const obj = new graphql.GraphQLInputObjectType({
        name: t.name,
        fields: graphqlFields,
      });

      typeMap.set(t, obj);
      return obj;
  }
}

export function toGraphQOutputType<Ctx>(
  t: OutputType<Ctx, any>,
  typeMap: Map<AllType<Ctx>, graphql.GraphQLType>
): graphql.GraphQLOutputType {
  const found = typeMap.get(t);

  if (found) {
    return typeMap.get(t) as graphql.GraphQLOutputType;
  }

  switch (t.kind) {
    case 'Scalar':
      let scalar;

      if ('builtInType' in t) {
        scalar = t.builtInType;
      } else {
        scalar = new graphql.GraphQLScalarType({
          ...t.graphqlTypeConfig,
        });
      }
      typeMap.set(t, scalar);
      return scalar;
    case 'Enum':
      const enumT = new graphql.GraphQLEnumType({
        name: t.name,
        description: t.description,
        values: t.values.reduce(
          (acc, val) => {
            acc[val.name] = { value: val.value };
            return acc;
          },
          {} as { [key: string]: any }
        ),
      });
      typeMap.set(t, enumT);
      return enumT;
    case 'NonNull':
      return new graphql.GraphQLNonNull(toGraphQOutputType(t.ofType, typeMap));
    case 'List':
      return new graphql.GraphQLList(toGraphQOutputType(t.ofType, typeMap));
    case 'ObjectType':
      const obj = new graphql.GraphQLObjectType({
        name: t.name,
        interfaces: t.interfaces.map(intf => toGraphQOutputType(intf, typeMap)) as any,
        fields: () => {
          const fields = t.fieldsFn();
          const gqlFieldConfig: graphql.GraphQLFieldConfigMap<unknown, Ctx> = {};

          fields.forEach(field => {
            const fieldArgs = field.arguments;
            const graphqlArgs: graphql.GraphQLFieldConfigArgumentMap = {};

            Object.keys(field.arguments).forEach(k => {
              graphqlArgs[k] = {
                type: toGraphQLInputType((fieldArgs as any)[k].type, typeMap),
                description: (fieldArgs as any)[k].description,
              };
            });

            gqlFieldConfig[field.name] = {
              type: toGraphQOutputType(field.type, typeMap),
              description: field.description,
              resolve: field.resolve,
              args: graphqlArgs,
            } as graphql.GraphQLFieldConfig<unknown, Ctx, any>;
          });

          return gqlFieldConfig;
        },
      });

      typeMap.set(t, obj);
      return obj;

    case 'Union':
      const union = new graphql.GraphQLUnionType({
        name: t.name,
        types: t.types.map(t => toGraphQOutputType(t, typeMap)) as any,
        resolveType: (any: any) => typeMap.get(t.resolveType(any)) as any,
      });

      typeMap.set(t, union);
      return union;
    case 'Interface':
      const intf = new graphql.GraphQLInterfaceType({
        name: t.name,
        fields: () => {
          const fields = t.fieldsFn();
          const result: graphql.GraphQLFieldConfigMap<unknown, Ctx> = {};

          fields.forEach(field => {
            result[field.name] = {
              type: toGraphQOutputType(field.type, typeMap),
              description: field.description,
            };
          });

          return result;
        },
      });

      typeMap.set(t, intf);
      return intf;
  }
}
