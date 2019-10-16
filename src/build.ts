import * as graphql from 'graphql';
import {
  Schema,
  InputType,
  OutputType,
  AllType,
  DefaultArgument,
  Argument,
  SubscriptionObject,
  ArgMap,
} from './types';

export function buildGraphQLSchema<Ctx>(schema: Schema<Ctx>): graphql.GraphQLSchema {
  const typeMap = new Map();
  return new graphql.GraphQLSchema({
    query: toGraphQOutputType<Ctx>(schema.query, typeMap) as graphql.GraphQLObjectType,
    mutation:
      schema.mutation &&
      (toGraphQOutputType<Ctx>(schema.mutation, typeMap) as graphql.GraphQLObjectType),
    subscription: schema.subscription && toGraphQLSubscriptionObject(schema.subscription, typeMap),
  });
}

export function toGraphQLArgs<Ctx, T>(
  args: ArgMap<T>,
  typeMap: Map<AllType<Ctx>, graphql.GraphQLType>
): graphql.GraphQLFieldConfigArgumentMap {
  const graphqlArgs: graphql.GraphQLFieldConfigArgumentMap = {};

  Object.keys(args).forEach(k => {
    const arg: DefaultArgument<any> | Argument<any> = (args as any)[k];

    graphqlArgs[k] = {
      type: toGraphQLInputType(arg.type, typeMap),
      description: arg.description,
      defaultValue: arg.kind === 'DefaultArgument' ? arg.default : undefined,
    };
  });

  return graphqlArgs
}

export function toGraphQLSubscriptionObject<Ctx>(
  subscriptionObj: SubscriptionObject<Ctx>,
  typeMap: Map<AllType<Ctx>, graphql.GraphQLType>
): graphql.GraphQLObjectType {
  return new graphql.GraphQLObjectType({
    name: subscriptionObj.name,
    fields: () => {
      const gqlFieldConfig: graphql.GraphQLFieldConfigMap<unknown, Ctx> = {};

      subscriptionObj.fields.forEach(field => {
        gqlFieldConfig[field.name] = {
          type: toGraphQOutputType(field.type, typeMap),
          description: field.description,
          subscribe: (_root: unknown, args, ctx, info) => field.subscribe(args, ctx, info),
          resolve: field.resolve,
          args: toGraphQLArgs(field.args, typeMap),
          deprecationReason: field.deprecationReason,
        };
      });

      return gqlFieldConfig;
    },
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
    case 'NonNullInput':
      return new graphql.GraphQLNonNull(toGraphQLInputType(t.ofType, typeMap));
    case 'ListInput':
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
            deprecationReason: field.deprecationReason,
          } as graphql.GraphQLInputFieldConfig;
        });

        return gqlFieldConfig;
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
            acc[val.name] = {
              value: val.value,
              deprecationReason: val.deprecationReason,
              description: val.description,
            };
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
            gqlFieldConfig[field.name] = {
              type: toGraphQOutputType(field.type, typeMap),
              description: field.description,
              resolve: field.resolve,
              args: toGraphQLArgs(field.args, typeMap),
              deprecationReason: field.deprecationReason,
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
              deprecationReason: field.deprecationReason,
            };
          });

          return result;
        },
      });

      typeMap.set(t, intf);
      return intf;
  }
}
