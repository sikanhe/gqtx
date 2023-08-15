import {
  arg,
  field,
  mutationType,
  objectType,
  queryType,
  subscriptionField,
  subscriptionType,
  string,
  id,
  list,
  boolean,
  nonnull,
  ObjectType,
} from '../src';

declare module '../src/types' {
  interface Context {
    contextContent: string;
  }
}

{
  // correctly infer whether resolve function is mandatory or optional

  type Human = {
    id: string;
    age: number;
    friendIds: Array<string>;
  };

  objectType<Human>({
    name: 'Human',
    fields: () => [
      field({
        name: 'id',
        type: string,
      }),
      // @ts-expect-error: type Human does not have a name property, thus resolve function must be declared
      field({
        name: 'name',
        type: string,
      }),
      field({
        name: 'name',
        type: string,
        resolve: () => 'Anonym',
      }),
      // @ts-expect-error: type Human does have age property but it is not of type String, thus resolve function must be declared
      field({
        name: 'age',
        type: string,
      }),
      field({
        name: 'age',
        type: string,
        resolve: (source) => String(source.age),
      }),
      field({
        name: 'friendIds',
        type: list(id),
      }),
    ],
  });
}

{
  // correctly infer list types

  type Human = {
    id: string;
    age: number;
    friendIds: Array<string>;
  };

  const GraphQLHuman = objectType<Human>({
    name: 'Human',
    fields: () => [
      field({
        name: 'id',
        type: string,
      }),
    ],
  });

  objectType<Array<Human>>({
    name: 'HumanConnection',
    fields: () => [
      field({
        name: 'edges',
        type: list(nonnull(GraphQLHuman)),
        resolve: (value) => value,
      }),
    ],
  });

  objectType<Array<Human>>({
    name: 'HumanConnection',
    fields: () => [
      field({
        name: 'edges',
        type: nonnull(list(nonnull(GraphQLHuman))),
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

  // @ts-expect-error: 'GraphQLUserType' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  const GraphQLUserType = objectType<User>({
    name: 'User',
    fields: () => [
      field({ name: 'id', type: nonnull(id) }),
      field({ name: 'name', type: nonnull(string) }),
      field({
        name: 'parent',
        type: GraphQLUserType,
        resolve: () => {
          return 5;
        },
      }),
    ],
  });

  const GraphQLUserType1: ObjectType<User | null> =
    objectType<User>({
      name: 'User',
      fields: () => [
        field({ name: 'id', type: nonnull(id) }),
        field({ name: 'name', type: nonnull(string) }),
        field({
          name: 'parent',
          type: GraphQLUserType1,
          // @ts-expect-error: Type 'number' is not assignable to type 'User | Promise<User | null> | null'
          resolve: () => {
            return 5;
          },
        }),
      ],
    });

  const GraphQLUserType2: ObjectType<User | null> =
    objectType<User>({
      name: 'User',
      fields: () => [
        field({ name: 'id', type: nonnull(id) }),
        field({ name: 'name', type: nonnull(string) }),
        field({
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
  subscriptionField({
    name: 'foo',
    type: boolean,
    subscribe: async function* () {
      yield true;
    },
  });

  subscriptionField({
    name: 'foo',
    type: boolean,
    // @ts-expect-error: subscribe must return number not object with number property
    subscribe: async function* () {
      yield { foo: true };
    },
  });

  subscriptionField({
    name: 'foo',
    type: boolean,
    // @ts-expect-error: subscribe must return number not object with string property
    subscribe: async function* () {
      yield { foo: 'true' };
    },
  });
}

{
  // arguments
  field({
    name: 'foo',
    type: boolean,
    args: {
      foo: arg({ type: boolean }),
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
  objectType({
    name: 'Foo',
    // @ts-expect-error: Source has 0 element(s) but target requires 1.ts(2322)
    fields: () => [],
  });

  mutationType({
    name: 'Foo',
    // @ts-expect-error: Source has 0 element(s) but target requires 1.ts(2322)
    fields: () => [],
  });

  queryType({
    name: 'Foo',
    // @ts-expect-error: Source has 0 element(s) but target requires 1.ts(2322)
    fields: () => [],
  });

  subscriptionType({
    name: 'Foo',
    // @ts-expect-error: Source has 0 element(s) but target requires 1.ts(2322)
    fields: () => [],
  });
}
