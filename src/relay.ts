import { ObjectType, Field, Interface, Argument, TOfArgMap } from './types';
import { Factory } from './define';

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

export function createRelayHelpers<Ctx>(t: Factory<Ctx>) {
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
      t.defaultField('hasNextPage', t.NonNull(t.Boolean), {
        description: 'When paginating forwards, are there more items?',
      }),
      t.defaultField('hasPreviousPage', t.NonNull(t.Boolean), {
        description: 'When paginating backwards, are there more items?',
      }),
      t.defaultField('startCursor', t.String, {
        description: 'When paginating backwards, the cursor to continue.',
      }),
      t.defaultField('endCursor', t.String, {
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
        t.defaultField('node', t.NonNull(nodeType), {
          description: 'The item at the end of the edge',
        }),
        t.defaultField('cursor', t.NonNull(t.String), {
          description: 'A cursor for use in pagination',
        }),
        ...edgeFields(),
      ],
    });

    const connectionType = t.objectType<Connection<T>, Ctx>({
      name: name + 'Connection',
      description: 'A connection to a list of items.',
      fields: () => [
        t.defaultField('pageInfo', t.NonNull(pageInfoType), {
          description: 'Information to aid in pagination.',
        }),
        t.defaultField('edges', t.List(edgeType), {
          description: 'A list of edges.',
        }),
        ...connectionFields(),
      ],
    });

    return { edgeType, connectionType };
  }

  return {
    forwardConnectionArgs,
    backwardConnectionArgs,
    connectionArgs,
    pageInfoType,
    connectionDefinitions,
  };
}
