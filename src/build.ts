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
  Context,
} from './types';

export function buildGraphQLSchema<RootSrc>(
  schema: Schema<RootSrc>
): graphql.GraphQLSchema {
  const typeMap = new Map();
  return new graphql.GraphQLSchema({
    query: toGraphQLOutputType<RootSrc>(
      schema.query,
      typeMap
    ) as graphql.GraphQLObjectType,
    mutation:
      schema.mutation &&
      (toGraphQLOutputType<RootSrc>(
        schema.mutation,
        typeMap
      ) as graphql.GraphQLObjectType<RootSrc>),
    subscription:
      schema.subscription &&
      toGraphQLSubscriptionObject(schema.subscription, typeMap),
    types:
      schema.types &&
      schema.types.map(
        (type) =>
          toGraphQLOutputType(type, typeMap) as graphql.GraphQLObjectType<
            any,
            any
          >
      ),
    directives: schema.directives,
  });
}

export function toGraphQLArgs<T>(
  args: ArgMap<T>,
  typeMap: Map<AllType, graphql.GraphQLType>
): graphql.GraphQLFieldConfigArgumentMap {
  const graphqlArgs: graphql.GraphQLFieldConfigArgumentMap = {};

  Object.keys(args).forEach((k) => {
    const arg: DefaultArgument<any> | Argument<any> = (args as any)[k];

    graphqlArgs[k] = {
      type: toGraphQLInputType(arg.type, typeMap),
      description: arg.description,
      defaultValue: arg.default,
    };
  });

  return graphqlArgs;
}

export function toGraphQLSubscriptionObject<RootSrc>(
  subscriptionObj: SubscriptionObject<RootSrc>,
  typeMap: Map<AllType, graphql.GraphQLType>
): graphql.GraphQLObjectType {
  return new graphql.GraphQLObjectType({
    name: subscriptionObj.name,
    fields: () => {
      const gqlFieldConfig: graphql.GraphQLFieldConfigMap<RootSrc, Context> =
        {};

      subscriptionObj.fields().forEach((field) => {
        gqlFieldConfig[field.name] = {
          type: toGraphQLOutputType(field.type, typeMap),
          description: field.description,
          subscribe: field.subscribe,
          resolve: field.resolve,
          args: toGraphQLArgs(field.args, typeMap),
          deprecationReason: field.deprecationReason,
        };
      });

      return gqlFieldConfig;
    },
  });
}

export function toGraphQLInputType(
  t: InputType<any>,
  typeMap: Map<AllType, graphql.GraphQLType>
): graphql.GraphQLInputType {
  const found = typeMap.get(t);

  if (found) {
    return typeMap.get(t) as graphql.GraphQLInputType;
  }

  switch (t.kind) {
    case 'Scalar':
    case 'Enum':
      return toGraphQLOutputType(t, typeMap) as graphql.GraphQLInputType;
    case 'NonNullInput':
      return new graphql.GraphQLNonNull(toGraphQLInputType(t.ofType, typeMap));
    case 'ListInput':
      return new graphql.GraphQLList(toGraphQLInputType(t.ofType, typeMap));
    case 'InputObject':
      const fields = t.fieldsFn();

      function graphqlFields() {
        const gqlFieldConfig: graphql.GraphQLInputFieldConfigMap = {};

        Object.keys(fields).forEach((k) => {
          const field = (fields as any)[k];
          gqlFieldConfig[k] = {
            type: toGraphQLInputType(field.type, typeMap),
            description: field.description,
            defaultValue: field.defaultValue,
            deprecationReason: field.deprecationReason,
          } as graphql.GraphQLInputFieldConfig;
        });

        return gqlFieldConfig;
      }

      const obj = new graphql.GraphQLInputObjectType({
        name: t.name,
        description: t.description,
        fields: graphqlFields,
      });

      typeMap.set(t, obj);
      return obj;
  }
}

export function toGraphQLOutputType<Src>(
  t: OutputType<any>,
  typeMap: Map<AllType, graphql.GraphQLType>
): graphql.GraphQLOutputType {
  const found = typeMap.get(t);

  if (found) {
    return found as graphql.GraphQLOutputType;
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
        values: t.values.reduce((acc, val) => {
          acc[val.name] = {
            value: val.value,
            deprecationReason: val.deprecationReason,
            description: val.description,
          };
          return acc;
        }, {} as { [key: string]: any }),
      });
      typeMap.set(t, enumT);
      return enumT;
    case 'NonNull':
      return new graphql.GraphQLNonNull(toGraphQLOutputType(t.ofType, typeMap));
    case 'List':
      return new graphql.GraphQLList(toGraphQLOutputType(t.ofType, typeMap));
    case 'ObjectType':
      const obj = new graphql.GraphQLObjectType({
        name: t.name,
        description: t.description,
        interfaces: t.interfaces.map((intf) =>
          toGraphQLOutputType(intf, typeMap)
        ) as any,
        isTypeOf: t.isTypeOf,
        fields: () => {
          const fields = t.fieldsFn();
          const gqlFieldConfig: graphql.GraphQLFieldConfigMap<Src, Context> =
            {};

          fields.forEach((field) => {
            gqlFieldConfig[field.name] = {
              type: toGraphQLOutputType(field.type, typeMap),
              description: field.description,
              resolve: field.resolve,
              args: toGraphQLArgs(field.args, typeMap),
              deprecationReason: field.deprecationReason,
              extensions: field.extensions,
            } as graphql.GraphQLFieldConfig<unknown, any>;
          });

          return gqlFieldConfig;
        },
        extensions: t.extensions,
      });

      typeMap.set(t, obj);
      return obj;

    case 'Union':
      const types = typeof t.types === 'function' ? t.types() : t.types;
      const union = new graphql.GraphQLUnionType({
        name: t.name,
        description: t.description,
        types: types.map((t) => toGraphQLOutputType(t, typeMap)) as any,
        resolveType: async (src, ctx, info) => {
          return t.resolveType(src, ctx, info);
        },
      });

      typeMap.set(t, union);
      return union;
    case 'Interface':
      const intf = new graphql.GraphQLInterfaceType({
        name: t.name,
        description: t.description,
        fields: () => {
          const fields = t.fieldsFn();
          const result: graphql.GraphQLFieldConfigMap<Src, Context> = {};

          fields.forEach((field) => {
            result[field.name] = {
              type: toGraphQLOutputType(field.type, typeMap),
              description: field.description,
              deprecationReason: field.deprecationReason,
              args: field.args && toGraphQLArgs(field.args, typeMap),
            };
          });

          return result;
        },
        interfaces: t.interfaces.map((intf) =>
          toGraphQLOutputType(intf, typeMap)
        ) as any,
        resolveType: async (src, ctx, info) => {
          return t.resolveType?.(src, ctx, info);
        },
      });

      typeMap.set(t, intf);
      return intf;
  }
}
