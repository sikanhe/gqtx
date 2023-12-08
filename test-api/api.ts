import { Gql, ObjectType } from '../src/index.js';

declare module '../src/types.js' {
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

  Gql.Object<Human>({
    name: 'Human',
    fields: () => [
      Gql.Field({
        name: 'id',
        type: Gql.String,
      }),
      // @ts-expect-error: type Human does not have a name property, thus resolve function must be declared
      Gql.Field({
        name: 'name',
        type: Gql.String,
      }),
      Gql.Field({
        name: 'name',
        type: Gql.String,
        resolve: () => 'Anonym',
      }),
      // @ts-expect-error: type Human does have age property but it is not of type String, thus resolve function must be declared
      Gql.Field({
        name: 'age',
        type: Gql.String,
      }),
      Gql.Field({
        name: 'age',
        type: Gql.String,
        resolve: (source) => String(source.age),
      }),
      Gql.Field({
        name: 'friendIds',
        type: Gql.List(Gql.ID),
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

  const GraphQLHuman = Gql.Object<Human>({
    name: 'Human',
    fields: () => [
      Gql.Field({
        name: 'id',
        type: Gql.String,
      }),
    ],
  });

  Gql.Object<Array<Human>>({
    name: 'HumanConnection',
    fields: () => [
      Gql.Field({
        name: 'edges',
        type: Gql.List(Gql.NonNull(GraphQLHuman)),
        resolve: (value) => value,
      }),
    ],
  });

  Gql.Object<Array<Human>>({
    name: 'HumanConnection',
    fields: () => [
      Gql.Field({
        name: 'edges',
        type: Gql.NonNull(Gql.List(Gql.NonNull(GraphQLHuman))),
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
  const GraphQLUserType = Gql.Object<User>({
    name: 'User',
    fields: () => [
      Gql.Field({ name: 'id', type: Gql.NonNull(Gql.ID) }),
      Gql.Field({ name: 'name', type: Gql.NonNull(Gql.String) }),
      Gql.Field({
        name: 'parent',
        type: GraphQLUserType,
        resolve: () => {
          return 5;
        },
      }),
    ],
  });

  const GraphQLUserType1: ObjectType<User | null> = Gql.Object<User>({
    name: 'User',
    fields: () => [
      Gql.Field({ name: 'id', type: Gql.NonNull(Gql.ID) }),
      Gql.Field({ name: 'name', type: Gql.NonNull(Gql.String) }),
      Gql.Field({
        name: 'parent',
        type: GraphQLUserType1,
        // @ts-expect-error: Type 'number' is not assignable to type 'User | Promise<User | null> | null'
        resolve: () => {
          return 5;
        },
      }),
    ],
  });

  const GraphQLUserType2: ObjectType<User | null> = Gql.Object<User>({
    name: 'User',
    fields: () => [
      Gql.Field({ name: 'id', type: Gql.NonNull(Gql.ID) }),
      Gql.Field({ name: 'name', type: Gql.NonNull(Gql.String) }),
      Gql.Field({
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
  Gql.SubscriptionField({
    name: 'foo',
    type: Gql.Boolean,
    subscribe: async function* () {
      yield true;
    },
  });

  Gql.SubscriptionField({
    name: 'foo',
    type: Gql.Boolean,
    // @ts-expect-error: subscribe must return number not object with number property
    subscribe: async function* () {
      yield { foo: true };
    },
  });

  Gql.SubscriptionField({
    name: 'foo',
    type: Gql.Boolean,
    // @ts-expect-error: subscribe must return number not object with string property
    subscribe: async function* () {
      yield { foo: 'true' };
    },
  });
}

{
  // arguments
  Gql.Field({
    name: 'foo',
    type: Gql.Boolean,
    args: {
      foo: Gql.Arg({ type: Gql.Boolean }),
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
  Gql.Object({
    name: 'Foo',
    // @ts-expect-error: Source has 0 element(s) but target requires 1.ts(2322)
    fields: () => [],
  });

  Gql.Mutation({
    name: 'Foo',
    // @ts-expect-error: Source has 0 element(s) but target requires 1.ts(2322)
    fields: () => [],
  });

  Gql.Query({
    name: 'Foo',
    // @ts-expect-error: Source has 0 element(s) but target requires 1.ts(2322)
    fields: () => [],
  });

  Gql.Subscription({
    name: 'Foo',
    // @ts-expect-error: Source has 0 element(s) but target requires 1.ts(2322)
    fields: () => [],
  });
}

{
  type Foo = { foo: string };
  type Bar = { bar: string };

  const FooType = Gql.Object<Foo>({
    name: 'Foo',
    fields: () => [
      Gql.Field({
        name: 'foo',
        type: Gql.NonNull(Gql.String),
      }),
    ],
  });

  Gql.Field({
    name: 'getFoo',
    type: Gql.NonNull(FooType),
    // @ts-expect-error: Type 'Foo | Bar' is not assignable to type 'PromiseOrValue<Foo>'.
    resolve: () => ({ bar: 'bar' } as Foo | Bar),
  });
}
