import { ObjectType, Field, Interface, Argument, TOfArgMap } from './types';
import { Factory } from './define';
import { GraphQLResolveInfo } from 'graphql';

// Adapted from
// https://github.com/graphql/graphql-relay-js/blob/master/src/connection/__tests__/connection.js

export type ConnectionConfig<Ctx, T> = {
  name?: string;
  nodeType: ObjectType<Ctx, T | null> | Interface<Ctx, T | null>;
  edgeFields?: () => Array<Field<Ctx, Edge<T>, any, any>>;
  connectionFields?: () => Array<Field<Ctx, Connection<T>, any, any>>;
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

export type RelayConnectionDefinitions<Ctx, T> = {
  edgeType: ObjectType<Ctx, Edge<T>>;
  connectionType: ObjectType<Ctx, Connection<T>>;
};

export function createRelayHelpers<Ctx, ExtensionsMap>(t: Factory<Ctx, ExtensionsMap>) {
  function nodeDefinitions<Src>(
    idFetcher: (id: string, context: Ctx, info: GraphQLResolveInfo) => Promise<Src> | Src
  ) {
    const nodeInterface = t.interfaceType({
      name: 'Node',
      description: 'An object with an ID',
      fields: () => [
        t.abstractField('id', t.NonNull(t.ID), {
          description: 'The id of the object.',
        }),
      ],
    });

    const nodeField = t.field({
      name:'node',
      type: nodeInterface, 
      args: {
        id: t.arg(t.NonNullInput(t.ID), 'The ID of an object'),
      },
      // TODO: figure out the as any
      resolve: (_, { id }, context, info) => idFetcher(id, context, info) as any
    });

    return { nodeInterface, nodeField };
  }

  const forwardConnectionArgs = {
    after: t.arg(t.String),
    first: t.arg(t.Int),
  };

  const backwardConnectionArgs = {
    before: t.arg(t.String),
    last: t.arg(t.Int),
  };

  const connectionArgs = {
    ...forwardConnectionArgs,
    ...backwardConnectionArgs,
  };

  const pageInfoType = t.objectType<PageInfo, Ctx>({
    name: 'PageInfo',
    description: 'Information about pagination in a connection.',
    fields: () => [
      t.field({ name: 'hasNextPage', type: t.NonNull(t.Boolean),
        description: 'When paginating forwards, are there more items?',
      }),
      t.field({ name: 'hasPreviousPage', type: t.NonNull(t.Boolean),
        description: 'When paginating backwards, are there more items?',
      }),
      t.field({ name: 'startCursor', type: t.String,
        description: 'When paginating backwards, the cursor to continue.',
      }),
      t.field({ name: 'endCursor', type: t.String,
        description: 'When paginating forwards, the cursor to continue.',
      }),
    ],
  });

  /**
   * Returns ObjectTypes for a connection with the given name,
   * and whose nodes are of the specified type.
   */
  function connectionDefinitions<T>(
    config: ConnectionConfig<Ctx, T>
  ): RelayConnectionDefinitions<Ctx, T> {
    const { nodeType } = config;
    const name = config.name || nodeType.name;

    // TODO
    const edgeFields = config.edgeFields || (() => []);
    const connectionFields = config.connectionFields || (() => []);

    const edgeType = t.objectType<Edge<T>, Ctx>({
      name: name + 'Edge',
      description: 'An edge in a connection.',
      fields: () => [
        // TODO: figure out how to fix the typings
        // @ts-ignore
        t.field({
          name: 'node',
          type: t.NonNull(nodeType),
          description: 'The item at the end of the edge',
        }),
        t.field({
          name: 'cursor',
          type: t.NonNull(t.String),
          description: 'A cursor for use in pagination',
        }),
        ...edgeFields(),
      ],
    });

    const connectionType = t.objectType<Connection<T>, Ctx>({
      name: name + 'Connection',
      description: 'A connection to a list of items.',
      fields: () => [
        t.field({ name: 'pageInfo', type: t.NonNull(pageInfoType),
          description: 'Information to aid in pagination.',
        }),
        t.field({ name: 'edges', type: t.List(edgeType),
          description: 'A list of edges.',
        }),
        ...connectionFields(),
      ],
    });

    return { edgeType, connectionType };
  }

  return {
    nodeDefinitions,
    forwardConnectionArgs,
    backwardConnectionArgs,
    connectionArgs,
    pageInfoType,
    connectionDefinitions,
  };
}
