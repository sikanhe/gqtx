---
title: Why gqtx
---

> Can we get the same type safety guarantees without the cruft? It turns out we can.

Having been working on GraphQL servers for the past 3 years, I have yet to found an approach that is *both* easy to use and minimizes developer error.

Shortcomings with the approaches of writing a GraphQL server today:

## Manual type casting resolvers
You can use `graphql-js` directly and do type casts manually, but this is very error prone because you have to hand write the types for all resolvers.

## CLI tools for types generation from SDL

This is a safer but tedious approach. You are required to first write your schema in <acronym title="Schema Definition Language">SDL</acronym>, generate resolver types via tooling (like [GraphQL Code Generator](https://graphql-code-generator.com)), and then write your resolvers in code.

1. This creates some extra mental overhead for having each graphql type's logic be split into two files with two different languages.
2. It requires a lot of fluff to make it work - Setting up `.graphql` file IDE plugin, setting up codegen, setting background process to run codegen in real time, importing the generated types and etc.

For a new team adopting GraphQL, you would have to teach them how to write SDL and use the codegen, on top of understanding how graphql works. This is a steeper hill to climb than necessary.

More on this topic: [The Problems of "Schema-First" GraphQL Server Development](https://www.prisma.io/blog/the-problems-of-schema-first-graphql-development-x1mn4cb0tyl3/)
