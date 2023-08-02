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
  Ctx,
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
    ctx: Ctx,
    info: graphql.GraphQLResolveInfo
  ) => PromiseOrValue<Out>;
};

type ResolvePartialOptional<Src, Arg, Out> = {
  resolve?: (
    src: Src,
    args: TOfArgMap<ArgMap<Arg>>,
    ctx: Ctx,
    info: graphql.GraphQLResolveInfo
  ) => PromiseOrValue<Out>;
};

function builtInScalar<Src>(
  builtInType: graphql.GraphQLScalarType
): Scalar<Src | null | undefined> {
  return {
    kind: 'Scalar',
    builtInType,
  };
}

export const GqlString = builtInScalar<string>(graphql.GraphQLString);
export const GqlInt = builtInScalar<number>(graphql.GraphQLInt);
export const GqlFloat = builtInScalar<number>(graphql.GraphQLFloat);
export const GqlBoolean = builtInScalar<boolean>(graphql.GraphQLBoolean);
export const GqlID = builtInScalar<string>(graphql.GraphQLID);

export function Scalar<Src>({
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

export function EnumType<Src>({
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

export function Arg<Src>(
  type: InputType<Src>,
  description?: string
): Argument<Src> {
  return {
    kind: 'Argument',
    type,
    description,
  };
}

export function DefaultArg<Src>(
  type: InputType<Src>,
  defaultArg: Exclude<Src, null | undefined>,
  description?: string
): DefaultArgument<Exclude<Src, null | undefined>> {
  return {
    kind: 'DefaultArgument',
    type: type as any,
    description,
    default: defaultArg,
  };
}

export function Field<Key extends string, Src, Out, Arg extends object = {}>({
  name,
  type,
  resolve,
  args,
  ...options
}: {
  name: Key;
  type: OutputType<Out>;
  args?: ArgMap<Arg> | undefined;
  description?: string | undefined;
  deprecationReason?: string | undefined;
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

export function AbstractField<Out>(opts: {
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

export function ObjectType<Src>({
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
  fields: (self: OutputType<Src | null>) => Array<Field<Src, any>>;
  isTypeOf?: (src: any, ctx: Ctx, info: graphql.GraphQLResolveInfo) => boolean;
  extensions?: ExtensionsMap['objectType'] extends undefined
    ? Record<string, any>
    : ExtensionsMap['objectType'];
}): ObjectType<Src | null | undefined> {
  const obj: ObjectType<Src | null | undefined> = {
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

export function InputObjectType<Src>({
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

export function UnionType<Src>({
  name,
  description,
  types,
  resolveType,
}: {
  name: string;
  description?: string;
  types: Array<ObjectType<any>>;
  resolveType: (src: Src) => string;
}): Union<Src | null | undefined> {
  return {
    kind: 'Union',
    name,
    description,
    types,
    resolveType,
  } as Union<Src | null | undefined>;
}

export function InterfaceType<Src>({
  name,
  description,
  interfaces = [],
  fields,
}: {
  name: string;
  description?: string;
  interfaces?: Array<Interface<any>>;
  fields: (self: Interface<Src | null>) => Array<AbstractField<any>>;
}): Interface<Src | null | undefined> {
  const obj: Interface<Src | null | undefined> = {
    kind: 'Interface',
    name,
    description,
    interfaces,
    fieldsFn: undefined as any,
  };

  obj.fieldsFn = () => fields(obj) as any;
  return obj;
}

export function List<Src>(
  ofType: OutputType<Src>
): OutputType<Array<Src> | null | undefined> {
  return {
    kind: 'List',
    ofType: ofType as any,
  };
}

export function ListInput<Src>(
  ofType: InputType<Src>
): InputType<Array<Src> | null | undefined> {
  return {
    kind: 'ListInput',
    ofType: ofType as any,
  };
}

export function NonNull<Src>(
  ofType: OutputType<Src | null | undefined>
): OutputType<Src> {
  return {
    kind: 'NonNull',
    ofType: ofType as any,
  };
}

export function NonNullInput<Src>(
  ofType: InputType<Src | null | undefined>
): InputType<Src> {
  return {
    kind: 'NonNullInput',
    ofType: ofType as any,
  };
}

export function QueryType<RootSrc>({
  name = 'Query',
  fields,
}: {
  name?: string;
  fields: () => Array<Field<RootSrc, any>>;
}): ObjectType<RootSrc> {
  return {
    kind: 'ObjectType',
    name,
    interfaces: [],
    fieldsFn: fields,
  };
}

export function MutationType<RootSrc>({
  name = 'Mutation',
  fields,
}: {
  name?: string;
  fields: () => Array<Field<RootSrc, any>>;
}): ObjectType<RootSrc> {
  return {
    kind: 'ObjectType',
    name,
    interfaces: [],
    fieldsFn: fields,
  };
}

export function SubscriptionField<RootSrc, Out, Arg>({
  name,
  type,
  args = {} as ArgMap<Arg>,
  subscribe,
  description,
  deprecationReason,
}: {
  name: string;
  type: OutputType<Out>;
  args?: ArgMap<Arg> | undefined;
  description?: string | undefined;
  deprecationReason?: string | undefined;
  subscribe: (
    src: RootSrc,
    args: TOfArgMap<ArgMap<Arg>>,
    ctx: Ctx,
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

export function SubscriptionType<Src>({
  name = 'Subscription',
  fields,
}: {
  name?: string;
  fields: () => Array<SubscriptionField<Src, any, any>>;
}): SubscriptionObject<Src> {
  return {
    kind: 'SubscriptionObject',
    name,
    fields,
  };
}
