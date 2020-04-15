# 0.6.0

- Now type constructors must be generated using `createTypesFactory<Ctx>()` function. The benefit is that now we
  can avoid manually asserting application `Context` type globally aross all schema types
- Root source value is now correctly typed for Query, Mutation, and Subscription resolvers at the top level.