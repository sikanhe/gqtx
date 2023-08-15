#### [Why another GraphqQL Server?](https://github.com/sikanhe/gqtx/blob/master/WHY.md)

## Getting Started

<p align="center">
<code>yarn add gqtx</code>
</p>

## Type-safety without manual work

`gqtx` is a thin layer on top of `graphql-js` for writing a type-safe GraphQL server in TypeScript. It provides you with a set of helper functions to create an intermediate representation of a GraphQL schema, and then converts that schema to a raw `graphql-js` schema. So you get to use everything from the reference implementation of GraphQL, but with way more type safety.

If a schema compiles, the following holds:

- The type of a field agrees with the return type of the resolver.
- The arguments of a field agrees with the accepted arguments of the resolver.
- The source of a field agrees with the type of the object to which it belongs.
- The return type of the resolver will not be input types (InputObject)
- The arguments of a field will not be abstract types (Interface, Union)
- The context argument for all resolver functions in a schema agree.

Most importantly, we achieve all this _without_ having to:

- Set up code generation tools
- Write SDL and having your schema partially defined in code and in a DSL file
- Require special compiler magic such as `reflect-metadata` and decorators

### What does it look like?

```ts
import { buildGraphQLSchema, id, string } from 'gqtx';

enum Role {
  Admin,
  User,
}

type User = {
  id: string;
  role: Role;
  name: string;
};

const users: User[] = [
  { id: '1', role: Role.Admin, name: 'Sikan' },
  { id: '2', role: Role.User, name: 'Nicole' },
];

// We can declare the app context type once, and it will
// be automatically inferred for all our resolvers
declare module "gqtx" {
  interface Context {
    viewerId: number;
    users: User[];
  }
}

const RoleEnum = enumType({
  name: 'Role',
  description: 'A user role',
  values: [
    { name: 'Admin', value: Role.Admin },
    { name: 'User', value: Role.User },
  ],
});

const UserType = objectType<User>({
  name: 'User',
  description: 'A User',
  fields: () => [
    field({ name: 'id', type: nonnull(id) }),
    field({ name: 'role', type: nonnull(RoleEnum) }),
    field({ name: 'name', type: nonnull(string) }),
  ],
});

const Query = queryType({
  fields: [
    field({
      name: 'userById',
      type: UserType,
      args: {
        id: arg({ type: nonnullInput(id) }),
      },
      resolve: (_, args, ctx) => {
        // `args` is automatically inferred as { id: string }
        // `ctx` (context) is also automatically inferred as { viewerId: number, users: User[] }
        const user = ctx.users.find((u) => u.id === args.id);
        // Also ensures we return an `User | null | undefined` type
        return user
      },
    }),
  ],
});

const schema = buildGraphQLSchema({
  query: Query,
});
```

#### Use your favorite server option to serve the schema!

```ts
import express from 'express';
import graphqlHTTP from 'express-graphql';

const app = express();

app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    graphiql: true,
  })
);

app.listen(4000);
```

## `gqtx` works best with TypeScript `strict` mode

We recommend using [TypeScript strict mode](https://www.typescriptlang.org/tsconfig#strict) in order to have the best developer experience.

**tsconfig.json**

```diff
{
  "compilerOptions": {
+    "strict": true
  }
}
```

## To Recap

- We created an intermediate representation of a GraphQL schema via the helper functions exported by this library.
- Then, we converted the schema to a real graphql-js schema by calling `buildGraphQLSchema` at server startup time.
- Used existing express middleware `express-graphql` to server our schema with `graphiql` explorer
- That's it! We get a fully type-safe server with almost zero type annotation needed
