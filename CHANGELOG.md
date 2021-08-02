# next

- Allow passing directives for the GraphQL schema to the `buildGraphQLSchema` function.

# 0.7.0

- The package now uses peer dependency
- Updated to work with Graphql-js v15. Allows interfaces to implement other interfaces (https://github.com/sikanhe/gqtx/pull/20)
- Simplified the ID scaler type (https://github.com/sikanhe/gqtx/pull/13)
- Support for adding additional types not reachable from the root (https://github.com/sikanhe/gqtx/pull/16)

# 0.6.0

- Now type constructors must be generated using `createTypesFactory<Ctx>()` function. The benefit is that now we
  can avoid manually asserting application `Context` type globally aross all schema types
- Root source value is now correctly typed for Query, Mutation, and Subscription resolvers at the top level.
