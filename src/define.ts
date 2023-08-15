import * as graphql from 'graphql';
import {
  Scalar,
  Enum,
  EnumValue,
  ObjectType,
  InputObject,
  Interface,
  Union,
  InputType,
  OutputType,
  ArgMap,
  TOfArgMap,
  Field,
  AbstractField,
  DefaultArgument,
  Argument,
  InputFieldMap,
  SubscriptionField,
  SubscriptionObject,
  PromiseOrValue,
  Context,
} from './types';

type ExtensionsMap = {
  field?: {
    [key: string]: any;
  };
  objectType?: {
    [key: string]: any;
  };
};

type ResolvePartialMandatory<Src, Arg, Out> = {
  resolve: (
    src: Src,
    args: TOfArgMap<ArgMap<Arg>>,
    ctx: Context,
    info: graphql.GraphQLResolveInfo
  ) => PromiseOrValue<Out>;
};

type ResolvePartialOptional<Src, Arg, Out> = {
  resolve?: (
    src: Src,
    args: TOfArgMap<ArgMap<Arg>>,
    ctx: Context,
    info: graphql.GraphQLResolveInfo
  ) => PromiseOrValue<Out>;
};

function builtInScalar<Src>(
  builtInType: graphql.GraphQLScalarType
): Scalar<Src | null> {
  return {
    kind: 'Scalar',
    builtInType,
  };
}

export const string: Scalar<string | null | undefined> = builtInScalar<string>(
  graphql.GraphQLString
);
export const int: Scalar<number | null | undefined> = builtInScalar<number>(
  graphql.GraphQLInt
);
export const float: Scalar<number | null | undefined> = builtInScalar<number>(
  graphql.GraphQLFloat
);
export const boolean: Scalar<boolean | null | undefined> =
  builtInScalar<boolean>(graphql.GraphQLBoolean);

export const id: Scalar<string | null | undefined> = builtInScalar<string>(
  graphql.GraphQLID
);

export function scalarType<Src>({
  name,
  description,
  serialize,
  parseValue,
  parseLiteral,
}: {
  name: string;
  description?: string;
  serialize: (src: Src) => any | null;
  parseValue?: (value: unknown) => Src | null;
  parseLiteral?: (value: graphql.ValueNode) => Src | null;
}): Scalar<Src | null> {
  return {
    kind: 'Scalar',
    graphqlTypeConfig: {
      name,
      description,
      serialize: serialize as any,
      parseLiteral,
      parseValue,
    },
  };
}

export function enumType<Src>({
  name,
  description,
  values,
}: {
  name: string;
  description?: string;
  values: Array<EnumValue<Src>>;
}): Enum<Src | null> {
  return {
    kind: 'Enum',
    name,
    description,
    values,
  };
}

export function arg<
  Src,
  TDefault extends Exclude<Src, null | undefined> | undefined
>({
  type,
  description,
  default: defaultArg,
}: {
  type: InputType<Src>;
  description?: string;
  default?: TDefault;
}): Argument<
  TDefault extends undefined
    ? Exclude<Src, undefined>
    : Exclude<Src, null | undefined>
> {
  return {
    kind: 'Argument',
    type: type as any,
    description,
    default: defaultArg as any,
  };
}

export function defaultArg<Src>(
  type: InputType<Src>,
  defaultArg: Exclude<Src, null>,
  description?: string
): DefaultArgument<Exclude<Src, null>> {
  return {
    kind: 'DefaultArgument',
    type: type as any,
    description,
    default: defaultArg,
  };
}

export function field<Key extends string, Src, Out, Arg extends object = {}>({
  name,
  type,
  resolve,
  args,
  ...options
}: {
  name: Key;
  type: OutputType<Out>;
  args?: ArgMap<Arg>;
  description?: string;
  deprecationReason?: string;
  extensions?: ExtensionsMap['field'];
} & (Key extends keyof Src
  ? Src[Key] extends Out
    ? ResolvePartialOptional<Src, Arg, Out>
    : ResolvePartialMandatory<Src, Arg, Out>
  : ResolvePartialMandatory<Src, Arg, Out>)) {
  return {
    kind: 'Field',
    name,
    type,
    args: args ?? {},
    // if no resolver is defined we fallback to the default GraphQL resolver which is (src) => src[fieldName]
    resolve: typeof resolve === 'function' ? resolve : undefined,
    ...options,
  } as Field<Src, any, any>;
}

export function abstractField<Out>(opts: {
  name: string;
  type: OutputType<Out>;

  description?: string;
  deprecationReason?: string;
  args?: ArgMap<unknown>;
}): AbstractField<Out> {
  return {
    kind: 'AbstractField',
    name: opts.name,
    description: opts.description,
    deprecationReason: opts.deprecationReason,
    args: opts.args,
    type: opts.type,
  };
}

export function objectType<Src>({
  name,
  description,
  interfaces = [],
  fields,
  isTypeOf,
  extensions,
}: {
  name: string;
  description?: string;
  interfaces?: Array<Interface<any>>;
  fields: (
    self: OutputType<Src | null>
  ) => [Field<Src, any, {}>, ...Field<Src, any, {}>[]];
  isTypeOf?: (
    src: any,
    ctx: Context,
    info: graphql.GraphQLResolveInfo
  ) => boolean;
  extensions?: ExtensionsMap['objectType'] extends undefined
    ? Record<string, any>
    : ExtensionsMap['objectType'];
}): ObjectType<Src | null> {
  const obj: ObjectType<Src | null> = {
    kind: 'ObjectType',
    name,
    description,
    interfaces,
    fieldsFn: undefined as any,
    isTypeOf: isTypeOf as any,
    extensions,
  };

  obj.fieldsFn = () => fields(obj) as any;
  return obj;
}

export function inputObjectType<Src>({
  name,
  description,
  fields,
}: {
  name: string;
  description?: string;
  fields: (self: InputType<Src | null>) => InputFieldMap<Src>;
}): InputObject<Src | null> {
  let inputObj: InputObject<Src | null> = {
    kind: 'InputObject',
    name,
    description,
    fieldsFn: null as any,
  };

  inputObj.fieldsFn = () => fields(inputObj);
  return inputObj;
}

export function unionType<Src>({
  name,
  description,
  types,
  resolveType,
}: {
  name: string;
  description?: string;
  types: Array<ObjectType<any>> | (() => Array<ObjectType<any>>);
  resolveType: (src: Src) => string;
}): Union<Src | null> {
  return {
    kind: 'Union',
    name,
    description,
    types,
    resolveType,
  } as Union<Src | null>;
}

export function interfaceType<Src>({
  name,
  description,
  interfaces = [],
  fields,
}: {
  name: string;
  description?: string;
  interfaces?: Array<Interface<any>> | (() => Array<Interface<any>>);
  fields: (self: Interface<Src | null>) => Array<AbstractField<any>>;
}): Interface<Src | null> {
  const obj: Interface<Src | null> = {
    kind: 'Interface',
    name,
    description,
    interfaces,
    fieldsFn: undefined as any,
  };

  obj.fieldsFn = () => fields(obj) as any;
  return obj;
}

export function list<Src>(
  ofType: OutputType<Src>
): OutputType<Array<Src> | null> {
  return {
    kind: 'List',
    ofType: ofType as any,
  };
}

export function listInput<Src>(
  ofType: InputType<Src>
): InputType<Array<Src> | null> {
  return {
    kind: 'ListInput',
    ofType: ofType as any,
  };
}

export function nonnull<Src>(
  ofType: OutputType<Src | null | undefined>
): OutputType<Src>;
export function nonnull<Src>(ofType: OutputType<Src | null>): OutputType<Src>;
export function nonnull(ofType: unknown): unknown {
  return {
    kind: 'NonNull',
    ofType: ofType as any,
  };
}

export function nonnullInput<Src>(
  ofType: InputType<Src | null | undefined>
): InputType<Src>;
export function nonnullInput<Src>(
  ofType: InputType<Src | null>
): InputType<Src>;
export function nonnullInput(ofType: unknown): unknown {
  return {
    kind: 'NonNullInput',
    ofType: ofType as any,
  };
}

export function queryType<RootSrc>({
  name = 'Query',
  fields,
}: {
  name?: string;
  fields: () => [Field<RootSrc, any, {}>, ...Field<RootSrc, any, {}>[]];
}): ObjectType<RootSrc> {
  return {
    kind: 'ObjectType',
    name,
    interfaces: [],
    fieldsFn: fields,
  };
}

export function mutationType<RootSrc>({
  name = 'Mutation',
  fields,
}: {
  name?: string;
  fields: () => [Field<RootSrc, any, {}>, ...Field<RootSrc, any, {}>[]];
}): ObjectType<RootSrc> {
  return {
    kind: 'ObjectType',
    name,
    interfaces: [],
    fieldsFn: fields,
  };
}

export function subscriptionField<RootSrc, Out, Arg>({
  name,
  type,
  args = {} as ArgMap<Arg>,
  subscribe,
  description,
  deprecationReason,
}: {
  name: string;
  type: OutputType<Out>;
  args?: ArgMap<Arg>;
  description?: string;
  deprecationReason?: string;
  subscribe: (
    src: RootSrc,
    args: TOfArgMap<ArgMap<Arg>>,
    ctx: Context,
    info: graphql.GraphQLResolveInfo
  ) => PromiseOrValue<AsyncIterableIterator<Out>>;
}): SubscriptionField<RootSrc, Arg, Out> {
  return {
    kind: 'SubscriptionField',
    name,
    type,
    args,
    subscribe: subscribe,
    resolve: (value: Out) => value,
    description,
    deprecationReason,
  };
}

export function subscriptionType<Src>({
  name = 'Subscription',
  fields,
}: {
  name?: string;
  fields: () => [
    SubscriptionField<Src, any, any>,
    ...SubscriptionField<Src, any, any>[]
  ];
}): SubscriptionObject<Src> {
  return {
    kind: 'SubscriptionObject',
    name,
    fields,
  };
}
