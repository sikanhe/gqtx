---
slug: /
title: Introduction
---

`gqtx` is a thin layer on top of `graphql-js` for writing a type-safe GraphQL server in TypeScript. It provides you with a set of helper functions to create an intermediate representation of a GraphQL schema, and then converts that schema to a raw `graphql-js` schema. So you get to use everything from the reference implementation of GraphQL, but with way more type safety.

If a schema compiles, the following holds:

- The type of a field agrees with the return type of the resolver.
- The arguments of a field agrees with the accepted arguments of the resolver.
- The source of a field agrees with the type of the object to which it belongs.
- The return type of the resolver will not be input types (`InputObject`)
- The arguments of a field will not be abstract types (`Interface`, `Union`)
- The context argument for all resolver functions in a schema agree.

- Set up code generation tools
- Write SDL and having your schema partially defined in code and in a DSL file
- Require special compiler magic such as `reflect-metadata` and decorators
