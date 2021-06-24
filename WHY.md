## Why

Having been working on GraphQL servers for the past 3 years, I have yet to found an approach that is _both_ easy to use and minimizes developer error.

Shortcomings with the approaches of writing a GraphQL server today:

#### 1. Use `graphql-js` directly and manual do type casts on resolvers

This is very error prone because you have to hand write the types for all resolvers.

#### 2. Use a type generation cli tool like https://graphql-code-generator.com to generate resolver types from SDL.

This is a safer but tedious approach. You are required to first write your schema in SDL, generate resolver types via tooling, and then write your resolvers in code.

First, this creates some extra mental overhead for having each graphql type's logic be split into two files with two different languages.

Second, it requires a lot of fluff to make it work - Setting up `.graphql` file IDE plugin, setting up codegen, setting background process to run codegen in real time, importing the generated types and etc.

For a new team adopting GraphQL, you would have to teach them how to write SDL and use the codegen, on top of understanding how graphql works. This is a steeper hill to climb than necessary.

More on this topic: https://www.prisma.io/blog/the-problems-of-schema-first-graphql-development-x1mn4cb0tyl3/

_Can we get the same type safety guarantees without the cruft? It turns out we can._
