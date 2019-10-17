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
} from './types';

export const StringType = builtInScalar<string>(graphql.GraphQLString);
export const IntType = builtInScalar<number>(graphql.GraphQLInt);
export const FloatType = builtInScalar<number>(graphql.GraphQLFloat);
export const BooleanType = builtInScalar<boolean>(graphql.GraphQLBoolean);
export const IntIDType = builtInScalar<number>(graphql.GraphQLID);
export const StringIDType = builtInScalar<string>(graphql.GraphQLID);
export const IDType = builtInScalar<any>(graphql.GraphQLID);

export function builtInScalar<Src>(builtInType: graphql.GraphQLScalarType): Scalar<Src | null> {
  return {
    kind: 'Scalar',
    builtInType,
  };
}

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
  parseValue?: (value: JSON) => Src | null;
  parseLiteral?: (value: graphql.ValueNode) => Src | null;
}): Scalar<Src | null> {
  return {
    kind: 'Scalar',
    graphqlTypeConfig: {
      name,
      description,
      serialize,
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

export function arg<Src>(type: InputType<Src>, description?: string): Argument<Src> {
  return {
    kind: 'Argument',
    type,
    description,
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

export function field<Ctx, Src, Arg, Out>(
  name: string,
  {
    type,
    args = {} as ArgMap<Arg>,
    resolve,
    description,
    deprecationReason,
  }: {
    type: OutputType<Ctx, Out>;
    args?: ArgMap<Arg>;
    description?: string;
    deprecationReason?: string;
    resolve: (
      src: Src,
      args: TOfArgMap<ArgMap<Arg>>,
      ctx: Ctx,
      info: graphql.GraphQLResolveInfo
    ) => Out | Promise<Out>;
  }
): Field<Ctx, Src, any, any> {
  return {
    kind: 'Field',
    name,
    type,
    description,
    deprecationReason,
    args,
    resolve,
  };
}

export function defaultField<Ctx, Src extends object, K extends keyof Src>(
  name: K,
  type: OutputType<Ctx, Src[K]>,
  opts?: {
    description?: string;
    deprecationReason?: string;
  }
): Field<Ctx, Src, any, any> {
  return {
    kind: 'Field',
    name: String(name),
    type,
    description: opts && opts.description,
    deprecationReason: opts && opts.deprecationReason,
    args: {},
    resolve: (src: Src) => src[name],
  };
}

export function abstractField<Ctx, Out>(
  name: string,
  type: OutputType<Ctx, Out>,
  opts?: {
    description?: string;
    deprecationReason?: string;
  }
): AbstractField<Ctx, Out> {
  return {
    kind: 'AbstractField',
    name,
    description: opts && opts.description,
    deprecationReason: opts && opts.deprecationReason,
    type,
  };
}

export function objectType<Src, Ctx = any>({
  name,
  description,
  interfaces = [],
  fields,
  isTypeOf,
}: {
  name: string;
  description?: string;
  interfaces?: Array<Interface<Ctx, any>>;
  fields: (self: OutputType<Ctx, Src | null>) => Array<Field<Ctx, Src, any>>;
  isTypeOf?: (src: any, ctx: Ctx, info: graphql.GraphQLResolveInfo) => boolean;
}): ObjectType<Ctx, Src | null> {
  const obj: ObjectType<Ctx, Src | null> = {
    kind: 'ObjectType',
    name,
    description,
    interfaces,
    fieldsFn: undefined as any,
    isTypeOf,
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

export function unionType<Src, Ctx = any>({
  name,
  types,
  resolveType,
}: {
  name: string;
  types: Array<ObjectType<Ctx, any>>;
  resolveType: (src: Src) => ObjectType<any, any>;
}): Union<Ctx, Src | null> {
  return {
    kind: 'Union',
    name,
    types,
    resolveType,
  } as Union<Ctx, Src | null>;
}

export function interfaceType<Src, Ctx = any>({
  name,
  description,
  fields,
}: {
  name: string;
  description?: string;
  fields: (self: Interface<Ctx, Src | null>) => Array<AbstractField<Ctx, any>>;
}): Interface<Ctx, Src | null> {
  const obj: Interface<Ctx, Src | null> = {
    kind: 'Interface',
    name,
    description,
    fieldsFn: undefined as any,
  };

  obj.fieldsFn = () => fields(obj) as any;
  return obj;
}

export function List<Ctx, Src>(ofType: OutputType<Ctx, Src>): OutputType<Ctx, Array<Src> | null> {
  return {
    kind: 'List',
    ofType: ofType as any,
  };
}

export function ListInput<Src>(ofType: InputType<Src>): InputType<Array<Src> | null> {
  return {
    kind: 'ListInput',
    ofType: ofType as any,
  };
}

export function NonNull<Ctx, Src>(ofType: OutputType<Ctx, Src | null>): OutputType<Ctx, Src> {
  return {
    kind: 'NonNull',
    ofType: ofType as any,
  };
}

export function NonNullInput<Src>(ofType: InputType<Src | null>): InputType<Src> {
  return {
    kind: 'NonNullInput',
    ofType: ofType as any,
  };
}

export function queryType<Ctx>({
  name = 'Query',
  fields,
}: {
  name?: string;
  fields: Array<Field<Ctx, void, any>>;
}): ObjectType<Ctx, void> {
  return {
    kind: 'ObjectType',
    name,
    interfaces: [],
    fieldsFn: () => fields,
  };
}

export function mutationType<Ctx>({
  name = 'Mutation',
  fields,
}: {
  name?: string;
  fields: () => Array<Field<Ctx, void, any>>;
}): ObjectType<Ctx, void> {
  return {
    kind: 'ObjectType',
    name,
    interfaces: [],
    fieldsFn: fields,
  };
}

export function subscriptionField<Ctx, Out, Arg>(
  name: string,
  {
    type,
    args = {} as ArgMap<Arg>,
    subscribe,
    resolve,
    description,
    deprecationReason,
  }: {
    type: OutputType<Ctx, Out>;
    args?: ArgMap<Arg>;
    description?: string;
    deprecationReason?: string;
    subscribe: (
      args: TOfArgMap<ArgMap<Arg>>,
      ctx: Ctx,
      info: graphql.GraphQLResolveInfo
    ) => AsyncIterator<Out> | Promise<AsyncIterator<Out>>;
    resolve?: (
      payload: Out,
      args: TOfArgMap<ArgMap<Arg>>,
      ctx: Ctx,
      info: graphql.GraphQLResolveInfo
    ) => Out | Promise<Out>;
  }
): SubscriptionField<Ctx, Arg, Out> {
  return {
    kind: 'SubscriptionField',
    name,
    type,
    args: args,
    subscribe,
    resolve,
    description,
    deprecationReason,
  };
}

export function subscriptionType<Ctx>({
  name = 'Subscription',
  fields,
}: {
  name?: string;
  fields: Array<SubscriptionField<Ctx, any, any>>;
}): SubscriptionObject<Ctx> {
  return {
    kind: 'SubscriptionObject',
    name,
    fields,
  };
}
