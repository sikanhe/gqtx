---
title: Object type
---

GraphQL object types represent a list of named fields that you can use to query data from your schema. Is composed by a required `name`, and `fields` function which return the list of object's fields.

## Definition

An object type can be defined using `objectType` API from the `createTypesFactory()`<!-- TODO: create page -->.

```ts
import { createTypesFactory } from "gqtx";

const t = createTypesFactory();

interface User {
  id: string
  name: string
  email: string | null
}

const userType = t.objectType<User>({
  name: 'User',
  description: 'A description for the User type',
  interfaces: [accountInterface],
  fields: () => [
    t.defaultField('id', t.NonNull(t.ID)),
    t.defaultField('name', t.NonNull(t.String)),
    t.defaultField('email', t.String),
  ]
})
```

<details>
  <summary>Show GraphQL SDL output</summary>

  ```gql
  # A description for the User type
  type User {
    id: ID!
    name: ID!
    email: String
  }
  ```

</details>

### Implementing interfaces

If you need to implement one or more interfaces, you can add the `interfaces` property name which contains an array of all interfaces (NB: has to be an `interfaceType`<!-- TODO: create page -->):

```ts {25}
import { createTypesFactory } from "gqtx";

const t = createTypesFactory();

interface Account {
  type: 'USER'
}

interface User extends Account {
  id: string
  name: string
  email: string | null
}

const accountInterface = t.interfaceType<Account>({
  name: 'Account',
  fields: () => [t.abstractField('type', t.NonNull(t.String))]
})


const userType = t.objectType<User>({
  name: 'User',
  description: 'A description for the User type',
  interfaces: [accountInterface],
  fields: () => [
    t.defaultField('id', t.NonNull(t.ID)),
    t.defaultField('name', t.NonNull(t.String)),
    t.defaultField('email', t.String),
    t.field('type', {
      type: t.NonNull(t.String),
      resolve: () => 'USER'
    })
  ]
})
```

<details>
  <summary>Show GraphQL SDL output</summary>

  ```gql
  # A description for the User type
  type User implements Account {
    id: ID!
    name: String!
    email: String
    type: String!
  }

  interface Account {
    type: String!
  }
  ```

</details>

### Resolving abstract object types

When an abstract type, like an interface<!-- TODO Add link to interfaces --> or an union<!-- TODO Add link to interfaces -->, needs to be resolved at runtime add an `isTypeOf` predicate function to the object type definition:

```ts
import { createTypesFactory, buildGraphQLSchema } from 'gqtx'

const t = createTypesFactory()

interface Account {
  type: 'USER' | 'BOT'
}

interface User extends Account {
  type: 'USER'
  id: string
  name: string
  email: string | null
}

interface Bot extends Account {
  name: string
}

const accountInterface = t.interfaceType<Account>({
  name: 'Account',
  fields: () => [t.abstractField('type', t.NonNull(t.String))]
})

const userType = t.objectType<User>({
  name: 'User',
  description: 'A description for the User type',
  interfaces: [accountInterface],
  isTypeOf: (source, context, info) => source.type === 'USER',
  fields: () => [
    t.defaultField('id', t.NonNull(t.ID)),
    t.defaultField('name', t.NonNull(t.String)),
    t.defaultField('email', t.String),
    t.field('type', {
      type: t.NonNull(t.String),
      resolve: () => 'USER'
    })
  ]
})

const botType = t.objectType<Bot>({
  name: 'Bot',
  description: 'A description for the Bot type',
  interfaces: [accountInterface],
  isTypeOf: (source, context, info) => source.type === 'BOT',
  fields: () => [
    t.defaultField('name', t.NonNull(t.String)),
    t.field('type', {
      type: t.NonNull(t.String),
      resolve: () => 'BOT'
    })
  ]
})
```

## Add object types to schema

Sometimes you need to add object types to the schema when they are not directly used (e.g. when resolving an interface at runtime). In order to achieve that you can add them in `types` in `buildGraphQLSchema`:

```ts
import { buildGraphQLSchema /*, ... */ } from "gqtx";

// ...

export const schema = buildGraphQLSchema({
  // ...
  types: [accountType]
})
```
