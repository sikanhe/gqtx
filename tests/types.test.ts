import * as graphql from "graphql";
import { describe } from "riteway";

import { buildGraphQLSchema, createTypesFactory } from "../src";

{
  const t = createTypesFactory();

  const UserType = t.objectType<{ id: string; name: string }>({
    name: "User",
    description: "A User",
    fields: () => [
      t.defaultField("id", t.NonNull(t.ID)),
      t.defaultField("name", t.NonNull(t.String)),
    ],
  });

  const user = {
    id: "user:id",
    name: "User name",
  };

  const schema = buildGraphQLSchema({
    query: t.queryType({
      fields: [
        t.field("user", {
          type: UserType,
          resolve: () => user,
        }),
      ],
    }),
  });

  describe("objectType", async (assert) => {
    assert({
      given: "a custom object type",
      should: "be a valid object type",
      actual: graphql.isObjectType(UserType),
      expected: true,
    });

    assert({
      given: "type with `defaultField`s",
      should: "return the field values",
      actual: await graphql
        .graphql(schema, `{ user { id, name }}`)
        .then(JSON.stringify),
      expected: JSON.stringify({
        data: {
          user,
        },
      }),
    });
  });
}
