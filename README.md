#### [Why another GraphqQL Server?](https://github.com/sikanhe/gqtx/blob/master/WHY.md)
Note: 0.9.0 contains breaking API changes. Go [here](https://github.com/sikanhe/gqtx/blob/1c709b529fe0b333b906f2b226039f80cfd540d5/README.md) for previous readme.

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
import { Gql, buildGraphQLSchema } from 'gqtx';

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
  interface GqlContext {
    viewerId: number;
    users: User[];
  }
}

const RoleEnum = Gql.Enum({
  name: 'Role',
  description: 'A user role',
  values: [
    { name: 'Admin', value: Role.Admin },
    { name: 'User', value: Role.User },
  ],
});

const UserType = Gql.Object<User>({
  name: 'User',
  description: 'A User',
  fields: () => [
    Gql.Field({ name: 'id', type: Gql.NonNull(Gql.ID) }),
    Gql.Field({ name: 'role', type: Gql.NonNull(RoleEnum) }),
    Gql.Field({ name: 'name', type: Gql.NonNull(Gql.String) }),
  ],
});

const Query = Gql.Query({
  fields: [
    Gql.Field({
      name: 'userById',
      type: UserType,
      args: {
        id: Gql.Arg({ type: Gql.NonNullInput(Gql.ID) }),
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
