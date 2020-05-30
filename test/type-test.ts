import { createTypesFactory } from "../src/index";

{
  /* Union Type */
  const t = createTypesFactory<{}>();
  type A = {
    type: "a";
    a: string;
  };
  type B = {
    type: "b";
    b: string;
  };
  type C = {
    type: "c";
    c: string;
  };

  const AType = t.objectType<A>({
    name: "Foo",
    fields: () => [
      t.field("a", {
        type: t.NonNull(t.String),
        resolve: (obj) => obj.a,
      }),
    ],
  });

  const BType = t.objectType<B>({
    name: "Foo",
    fields: () => [
      t.field("b", {
        type: t.NonNull(t.String),
        resolve: (obj) => obj.b,
      }),
    ],
  });

  const CType = t.objectType<C>({
    name: "Foo",
    fields: () => [
      t.field("c", {
        type: t.NonNull(t.String),
        resolve: (obj) => obj.c,
      }),
    ],
  });

  t.unionType({
    name: "UnionType",
    types: [AType, BType],
    resolveType: (obj) => {
      switch (obj.type) {
        case "a":
          return [AType, obj];
        case "b":
          return [BType, obj];
      }
    },
  });

  /* Invalid BType Tuple return */
  t.unionType({
    name: "UnionTypeInvalid1",
    types: [AType, BType],
    //@ts-expect-error
    resolveType: (obj) => {
      switch (obj.type) {
        case "a":
          return [AType, obj];
        case "b":
          return [AType, obj];
      }
    },
  });

  /* Missing CType Tuple Return */
  t.unionType({
    name: "UnionTypeInvalid1",
    types: [AType, BType, CType],
    //@ts-expect-error
    resolveType: (obj) => {
      switch (obj.type) {
        case "a":
          return [AType, obj];
        case "b":
          return [BType, obj];
      }
    },
  });
}
