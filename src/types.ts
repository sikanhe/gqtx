import * as graphql from 'graphql';

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

export type Scalar<Src> = {
  kind: 'Scalar';
  name: string;
  description?: string;
  serialize: (value: Src) => Src | null;
  parseValue?: (value: any) => Src | null;
  parseLiteral?: (valueAST: graphql.ValueNode) => Src | null;
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
  kind: 'List';
  ofType: InputType<Src>;
};

export type NonNullInput<Src> = {
  kind: 'NonNull';
  ofType: InputType<Src>;
};

export type Argument<Src> = {
  type: InputType<Src>;
  description?: string;
};

export type ArgMap<T> = {
  [K in keyof T]: Argument<T[K]>;
};

export type TOfArgMap<TArgMap> = {
  [K in keyof TArgMap]: TArgMap[K] extends Argument<infer Src> ? Src : never;
};

export type Field<Ctx, Src, Out, TArg extends object = {}> = {
  kind: 'Field';
  name: string;
  description?: string;
  type: OutputType<Ctx, Out>;
  arguments: ArgMap<TArg>;
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
  type: OutputType<Ctx, Out>;
};

export type ObjectType<Ctx, Src> = {
  kind: 'ObjectType';
  name: string;
  description?: string;
  deprecationReason?: string;
  interfaces: Array<Interface<Ctx, any>>;
  fieldsFn: () => Array<Field<Ctx, Src, any, any>>;
};

export type InputObject<Src> = {
  kind: 'InputObject';
  name: string;
  description?: string;
  fieldsFn: () => ArgMap<Src>;
};

export type Interface<Ctx, Src> = {
  kind: 'Interface';
  name: string;
  description?: string;
  fieldsFn: () => Array<AbstractField<Ctx, any>>;
  resolveType?: (src: Src) => ObjectType<Ctx, Src | null>;
};

export type Union<Ctx, Src> = {
  kind: 'Union';
  name: string;
  types: Array<ObjectType<Ctx, Src>>;
  resolveType: (src: Src) => ObjectType<Ctx, Src>;
};

export type Schema<Ctx> = {
  query: ObjectType<Ctx, void>;
};
