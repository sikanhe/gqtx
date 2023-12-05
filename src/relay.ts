import type {
  Field,
  InterfaceType,
  Argument,
  TOfArgMap,
  GqlContext,
  ObjectType,
} from './types.js';
import { Gql } from './define.js';
import { GraphQLResolveInfo } from 'graphql';

// Adapted from
// https://github.com/graphql/graphql-relay-js/blob/master/src/connection/__tests__/connection.js

export type ConnectionConfig<T> = {
  name?: string;
  nodeType: ObjectType<T | null> | InterfaceType<T | null>;
  edgeFields?: () => Array<Field<Edge<T>, any, any>>;
  connectionFields?: () => Array<Field<Connection<T>, any, any>>;
};

export type Edge<T> = {
  node: T;
  cursor: string;
};

export type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
};

export type Connection<T> = {
  edges: Array<Edge<T> | null> | null;
  pageInfo: PageInfo;
};

export type ConnectionArgumentsDefinition = {
  before: Argument<string | null>;
  last: Argument<number | null>;
  after: Argument<string | null>;
  first: Argument<number | null>;
};

export type ConnectionArguments = TOfArgMap<{
  before: Argument<string | null>;
  last: Argument<number | null>;
  after: Argument<string | null>;
  first: Argument<number | null>;
}>;

export type RelayConnectionDefinitions<T> = {
  edgeType: ObjectType<Edge<T> | null>;
  connectionType: ObjectType<Connection<T> | null>;
};

export function nodeDefinitions<Src>(
  idFetcher: (
    id: string,
    context: GqlContext,
    info: GraphQLResolveInfo
  ) => Promise<Src> | Src
) {
  const nodeInterface = Gql.InterfaceType({
    name: 'Node',
    description: 'An object with an ID',
    fields: () => [
      Gql.AbstractField({
        name: 'id',
        type: Gql.NonNull(Gql.ID),
        description: 'The id of the object.',
      }),
    ],
  });

  const nodeField = Gql.Field({
    name: 'node',
    type: nodeInterface,
    args: {
      id: Gql.Arg({
        type: Gql.NonNullInput(Gql.ID),
        description: 'The ID of an object',
      }),
    },
    resolve: (_, { id }, context, info) => idFetcher(id, context, info),
  });

  return { nodeInterface, nodeField };
}

export const forwardConnectionArgs = {
  after: Gql.Arg({ type: Gql.String }),
  first: Gql.Arg({ type: Gql.Int }),
};

export const backwardConnectionArgs = {
  before: Gql.Arg({ type: Gql.String }),
  last: Gql.Arg({ type: Gql.Int }),
};

export const connectionArgs = {
  ...forwardConnectionArgs,
  ...backwardConnectionArgs,
};

const pageInfoType = Gql.Object<PageInfo>({
  name: 'PageInfo',
  description: 'Information about pagination in a connection.',
  fields: () => [
    Gql.Field({
      name: 'hasNextPage',
      type: Gql.NonNull(Gql.Boolean),
      description: 'When paginating forwards, are there more items?',
    }),
    Gql.Field({
      name: 'hasPreviousPage',
      type: Gql.NonNull(Gql.Boolean),
      description: 'When paginating backwards, are there more items?',
    }),
    Gql.Field({
      name: 'startCursor',
      type: Gql.String,
      description: 'When paginating backwards, the cursor to continue.',
    }),
    Gql.Field({
      name: 'endCursor',
      type: Gql.String,
      description: 'When paginating forwards, the cursor to continue.',
    }),
  ],
});

/**
 * Returns Objects for a connection with the given name,
 * and whose nodes are of the specified type.
 */
export function connectionDefinitions<T>(
  config: ConnectionConfig<T>
): RelayConnectionDefinitions<T> {
  const { nodeType } = config;
  const name = config.name || nodeType.name;

  // TODO
  const edgeFields = config.edgeFields || (() => []);
  const connectionFields = config.connectionFields || (() => []);

  const edgeType = Gql.Object<Edge<T>>({
    name: name + 'Edge',
    description: 'An edge in a connection.',
    fields: () => [
      Gql.Field({
        name: 'node',
        type: nodeType,
        description: 'The item at the end of the edge',
      }),
      Gql.Field({
        name: 'cursor',
        type: Gql.NonNull(Gql.String),
        description: 'A cursor for use in pagination',
      }),
      ...edgeFields(),
    ],
  });

  const connectionType = Gql.Object<Connection<T>>({
    name: name + 'Connection',
    description: 'A connection to a list of items.',
    fields: () => [
      Gql.Field({
        name: 'pageInfo',
        type: Gql.NonNull(pageInfoType),
        description: 'Information to aid in pagination.',
      }),
      Gql.Field({
        name: 'edges',
        type: Gql.List(edgeType),
        description: 'A list of edges.',
      }),
      ...connectionFields(),
    ],
  });

  return { edgeType, connectionType };
}
