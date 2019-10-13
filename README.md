## Getting Started

`(yarn add|npm install) tsgql`

## Why
I have been developing GraphQL servers for the last 3 years. I have still yet to found an approach that is *both* easy to use and minimized developer error.

Let's go over our options today:

#### 1. Use `graphql-js` directly and manual do type casts on resolvers 
Very error prone to have to hand write the types for all resolvers. 

#### 2. Use a type generation cli tool like https://graphql-code-generator.com to generate resolver types from SDL. 

This is an okay approach. You are required to first write your schema in SDL , and then your resolvers in code, This breaks code sharing between types and with your other server code. 

As your schema get larger, it gets harder to maintain. You also can get vendor lock in. (Apollo Server and AppSync builds server differently).

#### 4. Use other typescript graphql libraries that use `reflect-metadata` compiler/decorator magic to infer graphql types from your runtime data types 
This requires turning on experimental features inside the typescript compiler. This approach also breaks seperation of concerns by tying your graphql types to your database models - Although starting your project that way is fine, eventually you want your GraphQL types be the type of your API. 

Can we do better? It turns out we can.

## Type safety without manual work
GraphQL schemas defined by this library can express more things and place more constraint on the graphql schema than the vanilla javascript or alternative typescript libraries: 

What this means is that only valid schemas should pass the type checker. If a schema compiles, the following holds:

- The type of a field agrees with the return type of the resolver.
- The arguments of a field agrees with the accepted arguments of the resolver.
- The source of a field agrees with the type of the object to which it belongs.
- The context argument for all resolver functions in a schema agree.

### What does it look like?

```ts
import * as t from 'tsgql/define'
import { buildGraphQLSchema } from 'tsgql'

enum Role {
  Admin,
  User,
}

type User = {
  id: number;
  role: Role;
  name: string;
};

const users: User[] = [
  { id: 1, role: Role.Admin, name: 'Sikan' },
  { id: 2, role: Role.User, name: 'Nicole' },
];

const RoleEnum = t.enumType({
  name: 'Role',
  description: 'A user role',
  values: [
    { name: 'Admin', value: Role.Admin }, 
    { name: 'User', value: Role.User }
  ],
});

const UserType = t.objectType<User>('User', {
  description: 'A User',
  fields: () => [
    t.fieldFast('id', t.NonNull(t.IntIDType)),
    t.fieldFast('role', t.NonNull(RoleEnum)),
    t.fieldFast('name', t.NonNull(t.StringType)),
  ],
});

const Query = t.queryType({
  fields: () => [
    t.field({
      name: 'userById',
      type: UserType,
      args: {
        id: { type: t.NonNullInput(t.IntIDType) },
      },
      resolve: (_, args) => {
        // `args` is automatically inferred as { id: string }
        const user = users.find(u => u.id === args.id) || null
        
        // Also ensures we return an `User` type
        return user;
      },
    }),
  ],
});

const schema = buildGraphQLSchema({
  query: Query
})
```

#### Use your favorate server option to serve the schema!

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

## What happened?
- We created an intermediate representation of a GraphQL schema via the helper functions exported by this library. 
- Then, we converted the schema to a real graphql-js schema by calling `buildGraphQLSchema` at server startup time. 
- That's it! We get a fully typesafe server with almost zero type annotation needed

## What this means: 
- No need to set code generation tools
- No need to write SDL and having your schema patially defined in code and in a DSL file
- No special compiler magic (`reflect-metadata`)