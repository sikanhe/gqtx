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
