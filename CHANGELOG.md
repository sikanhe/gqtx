# 0.6.0

- Now type constructors must be generated using `createTypesFactory<Ctx>()` function. The benefit is that now we
  can avoid manually asserting application `Context` type globally aross all schema types
