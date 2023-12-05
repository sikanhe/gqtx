# Next 

# 0.9.3
- [Breaking] All type constructors are exported under "Gql" namespace for easy autocompletion and reduce import bloat.
```ts
const UserType = Gql.Object<User>({
  name: 'User',
  description: 'A User',
  fields: () => [
    Gql.Field({ name: 'id', type: Gql.NonNull(Gql.ID) }),
    Gql.Field({ name: 'role', type: Gql.NonNull(RoleEnum) }),
    Gql.Field({ name: 'name', type: Gql.NonNull(Gql.String) }),
  ],
});
```
- [Breaking] No longer need create a builder just to have user provide GqlContext type
```ts
declare module "gqtx" {
  interface GqlContext {
    viewerId: number;
    users: User[];
  }
}
```
- [Breaking] No need for DefaultArg vs Arg, (leverage conditional types)
```ts
Gql.Arg({ name: "name", type: Gql.String, default: "Joe" })
```
- [Breaking] Union/Interface resolveType now returns string, as expected by graphql-js v16
- [Improvement] Union's types array can be now defined as a function to support forward references
```ts 
const GqlPostCommentUnion = Gql.Union({
  name: "PostOrCommentUnion",
  types: () => [GqlPost, GqlComment], // Can now be a function
  resolveType: (value) => {
    if (value.type === "Post") {
      // old: return GqlPost
      return GqlPost.name
    } else {
      // old: return GqlComment
      return GqlComment.name
    }
  },
})
```

# 0.8.1

- [Feat] Allow passing directives for the GraphQL schema to the `buildGraphQLSchema` function.
- [Feat] Input object type now supports default value (https://github.com/sikanhe/gqtx/pull/56)
- [Feat] New unified API for field and defaultField. You no longer need to use a different function for default field. (https://github.com/sikanhe/gqtx/pull/52)
- [Feat] Abstract fields can now have arguments enforced. (https://github.com/sikanhe/gqtx/pull/54)
- [Feat] Added helpers for building a Relay compliant schema. (https://github.com/sikanhe/gqtx/pull/27)
- [Feat] Can now pass directives to `buildGraphQLSchema` function. (https://github.com/sikanhe/gqtx/pull/23)
- [Improvement] Mutation fields is now an array to be consistent. (https://github.com/sikanhe/gqtx/pull/46)

# 0.7.0

- The package now uses peer dependency
- Updated to work with Graphql-js v15. Allows interfaces to implement other interfaces (https://github.com/sikanhe/gqtx/pull/20)
- Simplified the ID scaler type (https://github.com/sikanhe/gqtx/pull/13)
- Support for adding additional types not reachable from the root (https://github.com/sikanhe/gqtx/pull/16)

# 0.6.0

- Now type constructors must be generated using `createTypesFactory<Ctx>()` function. The benefit is that now we
  can avoid manually asserting application `Context` type globally aross all schema types
- Root source value is now correctly typed for Query, Mutation, and Subscription resolvers at the top level.
