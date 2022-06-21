import * as api from '../src';

{
  // correctly infer whether resolve function is mandatory or optional

  type Context = unknown;
  const t = api.createTypesFactory<Context>();

  type Human = {
    id: string;
    age: number;
    friendIds: Array<string>;
  };

  t.objectType<Human>({
    name: 'Human',
    fields: () => [
      t.field({
        name: 'id',
        type: t.String,
      }),
      // @ts-expect-error: type Human does not have a name property, thus resolve function must be declared
      t.field({
        name: 'name',
        type: t.String,
      }),
      t.field({
        name: 'name',
        type: t.String,
        resolve: () => 'Anonym',
      }),
      // @ts-expect-error: type Human does have age property but it is not of type String, thus resolve function must be declared
      t.field({
        name: 'age',
        type: t.String,
      }),
      t.field({
        name: 'age',
        type: t.String,
        resolve: (source) => String(source.age),
      }),
      t.field({
        name: 'friendIds',
        type: t.List(t.ID),
      }),
    ],
  });
}

{
  // correctly infer list types

  const t = api.createTypesFactory<unknown>();

  type Human = {
    id: string;
    age: number;
    friendIds: Array<string>;
  };

  const GraphQLHuman = t.objectType<Human>({
    name: 'Human',
    fields: () => [
      t.field({
        name: 'id',
        type: t.String,
      }),
    ],
  });

  t.objectType<Array<Human>>({
    name: 'HumanConnection',
    fields: () => [
      t.field({
        name: 'edges',
        type: t.List(t.NonNull(GraphQLHuman)),
        resolve: (value) => value,
      }),
    ],
  });

  t.objectType<Array<Human>>({
    name: 'HumanConnection',
    fields: () => [
      t.field({
        name: 'edges',
        type: t.NonNull(t.List(t.NonNull(GraphQLHuman))),
        resolve: (value) => value,
      }),
    ],
  });
}

{
  // self-referencing object type (noImplicitAny)

  type User = {
    id: string;
    name: string;
  };

  type Context = unknown;
  const t = api.createTypesFactory<Context>();

  // @ts-expect-error: 'GraphQLUserType' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  const GraphQLUserType = t.objectType<User>({
    name: 'User',
    fields: () => [
      t.field({ name: 'id', type: t.NonNull(t.ID) }),
      t.field({ name: 'name', type: t.NonNull(t.String) }),
      t.field({
        name: 'parent',
        type: GraphQLUserType,
        resolve: () => {
          return 5;
        },
      }),
    ],
  });

  const GraphQLUserType1: api.ObjectType<Context, User | null> =
    t.objectType<User>({
      name: 'User',
      fields: () => [
        t.field({ name: 'id', type: t.NonNull(t.ID) }),
        t.field({ name: 'name', type: t.NonNull(t.String) }),
        t.field({
          name: 'parent',
          type: GraphQLUserType1,
          // @ts-expect-error: Type 'number' is not assignable to type 'User | Promise<User | null> | null'
          resolve: () => {
            return 5;
          },
        }),
      ],
    });

  const GraphQLUserType2: api.ObjectType<Context, User | null> =
    t.objectType<User>({
      name: 'User',
      fields: () => [
        t.field({ name: 'id', type: t.NonNull(t.ID) }),
        t.field({ name: 'name', type: t.NonNull(t.String) }),
        t.field({
          name: 'parent',
          type: GraphQLUserType2,
          resolve: () => {
            return { id: '1', name: 'Peter' };
          },
        }),
      ],
    });
}

{
  // Subscription API Test
  type Context = unknown;
  const t = api.createTypesFactory<Context>();

  // subscribe yields a type that extends Out
  // so resolve can be the identity
  t.subscriptionField({
    name: 'foo',
    type: t.Boolean,
    subscribe: async function* () {
      yield true;
    },
    resolve: (p) => p,
  });

  // subscribe yields a type that extends Out
  // so resolve can be omitted
  t.subscriptionField({
    name: 'foo',
    type: t.Boolean,
    subscribe: async function* () {
      yield true;
    },
  });

  // subscribe yields an Event type that does not extend Out
  // so resolve must be Event => Out
  t.subscriptionField({
    name: 'foo',
    type: t.Boolean,
    subscribe: async function* () {
      yield { bar: true };
    },
    resolve: (p) => p.bar,
  });

  // subscribe yields an Event type that does not extend Out
  // so this does not type check
  t.subscriptionField({
    name: 'foo',
    type: t.Boolean,
    subscribe: async function* () {
      yield { bar: true };
    },
    // @ts-expect-error: type { bar: boolean } is not assignable to bool
    resolve: (p) => p,
  });
}

{
  // arguments

  const t = api.createTypesFactory<unknown>();

  t.field({
    name: 'foo',
    type: t.Boolean,
    args: {
      foo: t.arg(t.Boolean),
    },
    // args.foo should be boolean | null | undefined
    resolve: (_, args) => {
      if (args.foo === undefined) {
        // ok, no argument was passed
        const _value: undefined = args.foo;
        console.log(_value);
      }
      if (args.foo === true) {
        // ok, boolean argument was passed
        const _value: boolean = args.foo;
        console.log(_value);
      }
      if (args.foo === null) {
        // ok, null was passed as argument
        const _value: null = args.foo;
        console.log(_value);
      }

      return true;
    },
  });
}

{
  // require at least one field

  const t = api.createTypesFactory<unknown>();

  t.objectType({
    name: 'Foo',
    // @ts-expect-error: Source has 0 element(s) but target requires 1.ts(2322)
    fields: () => [],
  });

  t.mutationType({
    name: 'Foo',
    // @ts-expect-error: Source has 0 element(s) but target requires 1.ts(2322)
    fields: () => [],
  });

  t.queryType({
    name: 'Foo',
    // @ts-expect-error: Source has 0 element(s) but target requires 1.ts(2322)
    fields: () => [],
  });

  t.subscriptionType({
    name: 'Foo',
    // @ts-expect-error: Source has 0 element(s) but target requires 1.ts(2322)
    fields: () => [],
  });
}
