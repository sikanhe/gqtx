import * as graphql from 'graphql';

type PromiseOrValue<T> = Promise<T> | T;
type Maybe<T> = T | null | undefined;

export type OutputType<Ctx, Src> =
  | Scalar<Src>
  | Enum<Src>
  | ObjectType<Ctx, Src>
  | Union<Ctx, Src>
  | Interface<Ctx, Src>
  | ListType<Ctx, Src>
  | NonNullType<Ctx, Src>;

interface ListType<Ctx, Src> extends List<Ctx, OutputType<Ctx, Src>> {}
interface NonNullType<Ctx, Src> extends NonNull<Ctx, OutputType<Ctx, Src>> {}

export type InputType<Src> =
  | Scalar<Src>
  | Enum<Src>
  | InputObject<Src>
  | ListInputType<Src>
  | NonNullInputType<Src>;

interface ListInputType<Src> extends ListInput<InputType<Src>> {}
interface NonNullInputType<Src> extends NonNullInput<InputType<Src>> {}

export type AllType<Ctx> = OutputType<Ctx, any> | InputType<any>;

export type Scalar<Src> =
  | {
      kind: 'Scalar';
      graphqlTypeConfig: graphql.GraphQLScalarTypeConfig<Src, JSON>;
    }
  | {
      kind: 'Scalar';
      builtInType: graphql.GraphQLScalarType;
    };

export type Enum<Src> = {
  kind: 'Enum';
  name: string;
  description?: string;
  values: Array<EnumValue<Src>>;
};

export type EnumValue<Src> = {
  name: string;
  description?: string;
  deprecationReason?: string;
  value: Src;
};

export type List<Ctx, Src> = {
  kind: 'List';
  ofType: OutputType<Ctx, Src>;
};

export type NonNull<Ctx, Src> = {
  kind: 'NonNull';
  ofType: OutputType<Ctx, Src>;
};

export type ListInput<Src> = {
  kind: 'ListInput';
  ofType: InputType<Src>;
};

export type NonNullInput<Src> = {
  kind: 'NonNullInput';
  ofType: InputType<Src>;
};

export type Argument<Src> = {
  kind: 'Argument';
  type: InputType<Src>;
  description?: string;
};

export type DefaultArgument<Src> = {
  kind: 'DefaultArgument';
  type: InputType<Src>;
  description?: string;
  default: Src;
};

export type ArgMap<T> = {
  [K in keyof T]: DefaultArgument<T[K]> | Argument<T[K]>;
};

export type TOfArgMap<TArgMap> = {
  [K in keyof TArgMap]: TArgMap[K] extends DefaultArgument<infer Src> | Argument<infer Src>
    ? Src
    : never;
};

export type Field<Ctx, Src, Out, TArg extends object = {}> = {
  kind: 'Field';
  name: string;
  description?: string;
  type: OutputType<Ctx, Out>;
  args: ArgMap<TArg>;
  deprecationReason?: string;
  resolve: (
    src: Src,
    args: TOfArgMap<ArgMap<TArg>>,
    ctx: Ctx,
    info: graphql.GraphQLResolveInfo
  ) => Out | Promise<Out>;
};

export type AbstractField<Ctx, Out> = {
  kind: 'AbstractField';
  name: string;
  description?: string;
  deprecationReason?: string;
  type: OutputType<Ctx, Out>;
};

export type ObjectType<Ctx, Src> = {
  kind: 'ObjectType';
  name: string;
  description?: string;
  deprecationReason?: string;
  interfaces: Array<Interface<Ctx, any>>;
  fieldsFn: () => Array<Field<Ctx, Src, any, any>>;
  isTypeOf?: (src: any, ctx: Ctx, info: graphql.GraphQLResolveInfo) => boolean | Promise<boolean>;
};

export type InputField<Src> = {
  type: InputType<Src>;
  description?: string;
};

export type InputFieldMap<T> = {
  [K in keyof T]: InputField<T[K]>;
};

export type InputObject<Src> = {
  kind: 'InputObject';
  name: string;
  description?: string;
  fieldsFn: () => InputFieldMap<Src>;
};

type ResolveType<Src, Ctx> = (
  src: Src,
  ctx: Ctx,
  info: graphql.GraphQLResolveInfo
) => PromiseOrValue<Maybe<ObjectType<Ctx, Src | null> | string>>;

export type Interface<Ctx, Src> = {
  kind: 'Interface';
  name: string;
  description?: string;
  fieldsFn: () => Array<AbstractField<Ctx, any>>;
  resolveType?: ResolveType<Src, Ctx>;
};

export type Union<Ctx, Src> = {
  kind: 'Union';
  name: string;
  types: Array<ObjectType<Ctx, Src>>;
  resolveType: ResolveType<Src, Ctx>;
};

export type SubscriptionObject<Ctx, Src> = {
  kind: 'SubscriptionObject';
  name: string;
  fields: Array<SubscriptionField<Ctx, Src, any>>;
};

export type SubscriptionField<Ctx, TArg, Out> = {
  kind: 'SubscriptionField';
  name: string;
  description?: string;
  type: OutputType<Ctx, Out>;
  args: ArgMap<TArg>;
  deprecationReason?: string;
  subscribe: (
    args: TOfArgMap<ArgMap<TArg>>,
    ctx: Ctx,
    info: graphql.GraphQLResolveInfo
  ) => PromiseOrValue<AsyncIterator<Out>>;
  resolve?: (
    payload: Out,
    args: TOfArgMap<ArgMap<TArg>>,
    ctx: Ctx,
    info: graphql.GraphQLResolveInfo
  ) => PromiseOrValue<Out>;
};

export type Schema<Ctx, Src> = {
  query: ObjectType<Ctx, Src>;
  mutation?: ObjectType<Ctx, Src>;
  subscription?: SubscriptionObject<Ctx, Src>;
};
