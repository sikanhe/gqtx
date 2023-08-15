import type {
  ObjectType,
  Field,
  Interface,
  Argument,
  TOfArgMap,
  Context,
} from './types';
import {
  id,
  int,
  list,
  string,
  boolean,
  nonnull,
  nonnullInput,
  abstractField,
  arg,
  field,
  interfaceType,
  objectType,
} from './define';
import { GraphQLResolveInfo } from 'graphql';

// Adapted from
// https://github.com/graphql/graphql-relay-js/blob/master/src/connection/__tests__/connection.js

export type ConnectionConfig<T> = {
  name?: string;
  nodeType: ObjectType<T | null> | Interface<T | null>;
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
  edgeType: ObjectType<Edge<T>>;
  connectionType: ObjectType<Connection<T>>;
};

export function nodeDefinitions<Src>(
  idFetcher: (
    id: string,
    context: Context,
    info: GraphQLResolveInfo
  ) => Promise<Src> | Src
) {
  const nodeInterface = interfaceType({
    name: 'Node',
    description: 'An object with an ID',
    fields: () => [
      abstractField({
        name: 'id',
        type: nonnull(id),
        description: 'The id of the object.',
      }),
    ],
  });

  const nodeField = field({
    name: 'node',
    type: nodeInterface,
    args: {
      id: arg({ type: nonnullInput(id), description: 'The ID of an object' }),
    },
    // TODO: figure out the as any
    resolve: (_, { id }, context, info) => idFetcher(id, context, info) as any,
  });

  return { nodeInterface, nodeField };
}

const forwardConnectionArgs = {
  after: arg({ type: string }),
  first: arg({ type: int }),
};

const backwardConnectionArgs = {
  before: arg({ type: string }),
  last: arg({ type: int }),
};

export const connectionArgs = {
  ...forwardConnectionArgs,
  ...backwardConnectionArgs,
};

const pageInfoType = objectType<PageInfo>({
  name: 'PageInfo',
  description: 'Information about pagination in a connection.',
  fields: () => [
    field({
      name: 'hasNextPage',
      type: nonnull(boolean),
      description: 'When paginating forwards, are there more items?',
    }),
    field({
      name: 'hasPreviousPage',
      type: nonnull(boolean),
      description: 'When paginating backwards, are there more items?',
    }),
    field({
      name: 'startCursor',
      type: string,
      description: 'When paginating backwards, the cursor to continue.',
    }),
    field({
      name: 'endCursor',
      type: string,
      description: 'When paginating forwards, the cursor to continue.',
    }),
  ],
});

/**
 * Returns ObjectTypes for a connection with the given name,
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

  const edgeType = objectType<Edge<T>>({
    name: name + 'Edge',
    description: 'An edge in a connection.',
    fields: () => [
      // TODO: figure out how to fix the typings
      // @ts-ignore
      field({
        name: 'node',
        type: nonnull(nodeType),
        description: 'The item at the end of the edge',
      }),
      field({
        name: 'cursor',
        type: nonnull(string),
        description: 'A cursor for use in pagination',
      }),
      ...edgeFields(),
    ],
  });

  const connectionType = objectType<Connection<T>>({
    name: name + 'Connection',
    description: 'A connection to a list of items.',
    fields: () => [
      field({
        name: 'pageInfo',
        type: nonnull(pageInfoType),
        description: 'Information to aid in pagination.',
      }),
      field({
        name: 'edges',
        type: list(edgeType),
        description: 'A list of edges.',
      }),
      ...connectionFields(),
    ],
  });

  return { edgeType, connectionType };
}
