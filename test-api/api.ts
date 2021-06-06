import * as api from "../src";

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
    name: "Human",
    fields: () => [
      t.field({
        name: "id",
        type: t.String,
      }),
      // @ts-expect-error: type Human does not have a name property, thus resolve function must be declared
      t.field({
        name: "name",
        type: t.String,
      }),
      t.field({
        name: "name",
        type: t.String,
        resolve: () => "Anonym",
      }),
      // @ts-expect-error: type Human does have age property but it is not of type String, thus resolve function must be declared
      t.field({
        name: "age",
        type: t.String,
      }),
      t.field({
        name: "age",
        type: t.String,
        resolve: (source) => String(source.age),
      }),
      t.field({
        name: "friendIds",
        type: t.List(t.ID),
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
    name: "User",
    fields: () => [
      t.field({ name: "id", type: t.NonNull(t.ID) }),
      t.field({ name: "name", type: t.NonNull(t.String) }),
      t.field({
        name: "parent",
        type: GraphQLUserType,
        resolve: () => {
          return 5;
        },
      }),
    ],
  });

  const GraphQLUserType1: api.ObjectType<Context, User | null> =
    t.objectType<User>({
      name: "User",
      fields: () => [
        t.field({ name: "id", type: t.NonNull(t.ID) }),
        t.field({ name: "name", type: t.NonNull(t.String) }),
        t.field({
          name: "parent",
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
      name: "User",
      fields: () => [
        t.field({ name: "id", type: t.NonNull(t.ID) }),
        t.field({ name: "name", type: t.NonNull(t.String) }),
        t.field({
          name: "parent",
          type: GraphQLUserType2,
          resolve: () => {
            return { id: "1", name: "Peter" };
          },
        }),
      ],
    });
}
