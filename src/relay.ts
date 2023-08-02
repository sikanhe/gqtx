import type {
  ObjectType,
  Field,
  Interface,
  Argument,
  TOfArgMap,
  Ctx,
} from './types';
import {
  GqlID,
  GqlInt,
  List,
  String,
  GqlBoolean,
  NonNull,
  NonNullInput,
  AbstractField,
  Arg,
  Field,
  InterfaceType,
  ObjectType,
} from './define';
import { GraphQLResolveInfo } from 'graphql';

// Adapted from
// https://github.com/graphql/graphql-relay-js/blob/master/src/connection/__tests__/connection.js

export type ConnectionConfig<T> = {
  name?: string;
  nodeType: ObjectType<T | null | undefined> | Interface<T | null | undefined>;
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
    context: Ctx,
    info: GraphQLResolveInfo
  ) => Promise<Src> | Src
) {
  const nodeInterface = InterfaceType({
    name: 'Node',
    description: 'An object with an ID',
    fields: () => [
      AbstractField({
        name: 'id',
        type: NonNull(GqlID),
        description: 'The id of the object.',
      }),
    ],
  });

  const nodeField = Field({
    name: 'node',
    type: nodeInterface,
    args: {
      id: Arg(NonNullInput(GqlID), 'The ID of an object'),
    },
    // TODO: figure out the as any
    resolve: (_, { id }, context, info) => idFetcher(id, context, info) as any,
  });

  return { nodeInterface, nodeField };
}

const forwardConnectionArgs = {
  after: Arg(String),
  first: Arg(GqlInt),
};

const backwardConnectionArgs = {
  before: Arg(String),
  last: Arg(GqlInt),
};

export const connectionArgs = {
  ...forwardConnectionArgs,
  ...backwardConnectionArgs,
};

const pageInfoType = ObjectType<PageInfo>({
  name: 'PageInfo',
  description: 'Information about pagination in a connection.',
  fields: () => [
    Field({
      name: 'hasNextPage',
      type: NonNull(GqlBoolean),
      description: 'When paginating forwards, are there more items?',
    }),
    Field({
      name: 'hasPreviousPage',
      type: NonNull(GqlBoolean),
      description: 'When paginating backwards, are there more items?',
    }),
    Field({
      name: 'startCursor',
      type: String,
      description: 'When paginating backwards, the cursor to continue.',
    }),
    Field({
      name: 'endCursor',
      type: String,
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

  const edgeType = ObjectType<Edge<T>>({
    name: name + 'Edge',
    description: 'An edge in a connection.',
    fields: () => [
      // TODO: figure out how to fix the typings
      // @ts-ignore
      Field({
        name: 'node',
        type: NonNull(nodeType),
        description: 'The item at the end of the edge',
      }),
      Field({
        name: 'cursor',
        type: NonNull(String),
        description: 'A cursor for use in pagination',
      }),
      ...edgeFields(),
    ],
  });

  const connectionType = ObjectType<Connection<T>>({
    name: name + 'Connection',
    description: 'A connection to a list of items.',
    fields: () => [
      Field({
        name: 'pageInfo',
        type: NonNull(pageInfoType),
        description: 'Information to aid in pagination.',
      }),
      Field({
        name: 'edges',
        type: List(edgeType),
        description: 'A list of edges.',
      }),
      ...connectionFields(),
    ],
  });

  return { edgeType, connectionType };
}
