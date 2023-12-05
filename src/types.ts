import * as graphql from 'graphql';

export type PromiseOrValue<T> = Promise<T> | T;
type Maybe<T> = T | null | undefined;

export interface GqlContext {}

export type OutputType<Src> =
  | ScalarType<Src>
  | EnumType<Src>
  | ObjectType<Src>
  | UnionType<Src>
  | InterfaceType<Src>
  | ListOutput<Src>
  | NonNullOutput<Src>;

interface ListOutput<Src> extends List<OutputType<Src>> {}
interface NonNullOutput<Src> extends NonNull<OutputType<Src>> {}

export type InputType<Src> =
  | ScalarType<Src>
  | EnumType<Src>
  | InputObjectType<Src>
  | ListInputType<Src>
  | NonNullInputType<Src>;

interface ListInputType<Src> extends ListInput<InputType<Src>> {}
interface NonNullInputType<Src> extends NonNullInput<InputType<Src>> {}

export type AllType = OutputType<any> | InputType<any>;

export type ScalarType<Src> =
  | {
      kind: 'Scalar';
      graphqlTypeConfig: graphql.GraphQLScalarTypeConfig<Src, unknown>;
    }
  | {
      kind: 'Scalar';
      builtInType: graphql.GraphQLScalarType;
    };

export type EnumType<Src> = {
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

export type List<Src> = {
  kind: 'List';
  ofType: OutputType<Src>;
};

export type NonNull<Src> = {
  kind: 'NonNull';
  ofType: OutputType<Src>;
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
  default?: Exclude<Src, null>;
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

export type ArgMapValue<TArg> = TArg extends DefaultArgument<infer Src>
  ? Src
  : TArg extends Argument<infer Src>
  ? Src extends null
    ? Maybe<Src>
    : Src
  : never;

export type TOfArgMap<TArgMap> = {
  [K in keyof TArgMap]: ArgMapValue<TArgMap[K]>;
};

export type Field<Src, Out, TArg extends object = {}> = {
  kind: 'Field';
  name: string;
  description?: string;
  type: OutputType<Out>;
  args: ArgMap<TArg>;
  deprecationReason?: string;
  resolve?: (
    src: Src,
    args: TOfArgMap<ArgMap<TArg>>,
    ctx: GqlContext,
    info: graphql.GraphQLResolveInfo
  ) => Out | Promise<Out>;
  extensions?: Record<string, any>;
};

export type AbstractField<Out> = {
  kind: 'AbstractField';
  name: string;
  description?: string;
  deprecationReason?: string;
  args?: ArgMap<unknown>;
  type: OutputType<Out>;
};

export type ObjectType<Src> = {
  kind: 'ObjectType';
  name: string;
  description?: string;
  deprecationReason?: string;
  interfaces: Array<InterfaceType<any>> | (() => Array<InterfaceType<any>>);
  fieldsFn: () => Array<Field<Src, any, any>>;
  isTypeOf?: (
    src: any,
    ctx: GqlContext,
    info: graphql.GraphQLResolveInfo
  ) => boolean | Promise<boolean>;
  extensions?: Record<string, any>;
};

export type InputField<Src> = {
  type: InputType<Src>;
  description?: string;
  defaultValue?: NonNullable<Src>;
};

export type InputFieldMap<T> = {
  [K in keyof T]: InputField<T[K]>;
};

export type InputObjectType<Src> = {
  kind: 'InputObject';
  name: string;
  description?: string;
  fieldsFn: () => InputFieldMap<Src>;
};

export type ResolveType<Src> = (
  src: Src,
  ctx: GqlContext,
  info: graphql.GraphQLResolveInfo,
  abstractType: UnionType<Src> | InterfaceType<Src>
) => PromiseOrValue<string | undefined>;

export type InterfaceType<Src> = {
  kind: 'Interface';
  name: string;
  description?: string;
  interfaces: Array<InterfaceType<any>> | (() => Array<InterfaceType<any>>);
  fieldsFn: () => Array<AbstractField<any>>;
  resolveType?: ResolveType<Src>;
};

export type UnionType<Src> = {
  kind: 'Union';
  name: string;
  description?: string;
  types: Array<ObjectType<Src>> | (() => Array<ObjectType<Src>>);
  resolveType: ResolveType<Src>;
};

export type SubscriptionObjectType<RootSrc> = {
  kind: 'SubscriptionObject';
  name: string;
  fields: () => Array<SubscriptionField<RootSrc, any, any>>;
};

export type SubscriptionField<RootSrc, TArg, Out> = {
  kind: 'SubscriptionField';
  name: string;
  description?: string;
  type: OutputType<Out>;
  args: ArgMap<TArg>;
  deprecationReason?: string;
  subscribe: (
    source: RootSrc,
    args: TOfArgMap<ArgMap<TArg>>,
    ctx: GqlContext,
    info: graphql.GraphQLResolveInfo
  ) => PromiseOrValue<AsyncIterableIterator<Out>>;
  resolve: (
    source: Out,
    args: TOfArgMap<ArgMap<TArg>>,
    ctx: GqlContext,
    info: graphql.GraphQLResolveInfo
  ) => PromiseOrValue<Out>;
};

export type Schema<RootSrc = undefined> = {
  query: ObjectType<RootSrc>;
  mutation?: ObjectType<RootSrc>;
  subscription?: SubscriptionObjectType<RootSrc>;
  types?: ObjectType<any>[];
  directives?: graphql.GraphQLDirective[];
};
