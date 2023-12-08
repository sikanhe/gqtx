import * as graphql from 'graphql';
import type {
  ScalarType,
  EnumType,
  EnumValue,
  ObjectType,
  InputObjectType,
  InterfaceType,
  UnionType,
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
  SubscriptionObjectType,
  PromiseOrValue,
  GqlContext,
} from './types.js';

type ExtensionsMap = {
  field?: {
    [key: string]: any;
  };
  objectType?: {
    [key: string]: any;
  };
};

type NoInfer<T> = [T][T extends any ? 0 : never];

type ResolvePartialMandatory<Src, Arg, Out> = {
  resolve: (
    src: Src,
    args: TOfArgMap<ArgMap<Arg>>,
    ctx: GqlContext,
    info: graphql.GraphQLResolveInfo
  ) => PromiseOrValue<NoInfer<Out>>;
};

type ResolvePartialOptional<Src, Arg, Out> = {
  resolve?: (
    src: Src,
    args: TOfArgMap<ArgMap<Arg>>,
    ctx: GqlContext,
    info: graphql.GraphQLResolveInfo
  ) => PromiseOrValue<NoInfer<Out>>;
};

function builtInScalar<Src>(
  builtInType: graphql.GraphQLScalarType
): ScalarType<Src | null> {
  return {
    kind: 'Scalar',
    builtInType,
  };
}

export namespace Gql {
  export const String: ScalarType<string | null | undefined> =
    builtInScalar<string>(graphql.GraphQLString);
  export const Int: ScalarType<number | null | undefined> = builtInScalar<number>(
    graphql.GraphQLInt
  );
  export const Float: ScalarType<number | null | undefined> = builtInScalar<number>(
    graphql.GraphQLFloat
  );
  export const Boolean: ScalarType<boolean | null | undefined> =
    builtInScalar<boolean>(graphql.GraphQLBoolean);

  export const ID: ScalarType<string | null | undefined> = builtInScalar<string>(
    graphql.GraphQLID
  );

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
  }): ScalarType<Src | null> {
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

  export function Enum<Src>({
    name,
    description,
    values,
  }: {
    name: string;
    description?: string;
    values: Array<EnumValue<Src>>;
  }): EnumType<Src | null> {
    return {
      kind: 'Enum',
      name,
      description,
      values,
    };
  }

  export function Arg<
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

  export function DefaultArg<Src>(
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

  export function Field<Key extends string, Src, Out, Arg extends object = {}>({
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

  export function Object<Src>({
    name,
    description,
    interfaces = [],
    fields,
    isTypeOf,
    extensions,
  }: {
    name: string;
    description?: string;
    interfaces?: Array<InterfaceType<any>>;
    fields: (
      self: OutputType<Src | null>
    ) => [Field<Src, any, {}>, ...Field<Src, any, {}>[]];
    isTypeOf?: (
      src: any,
      ctx: GqlContext,
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

  export function InputObject<Src>({
    name,
    description,
    fields,
  }: {
    name: string;
    description?: string;
    fields: (self: InputType<Src | null>) => InputFieldMap<Src>;
  }): InputObjectType<Src | null> {
    let inputObj: InputObjectType<Src | null> = {
      kind: 'InputObject',
      name,
      description,
      fieldsFn: null as any,
    };

    inputObj.fieldsFn = () => fields(inputObj);
    return inputObj;
  }

  export function Union<Src>({
    name,
    description,
    types,
    resolveType,
  }: {
    name: string;
    description?: string;
    types: Array<ObjectType<any>> | (() => Array<ObjectType<any>>);
    resolveType: (src: Src) => string;
  }): UnionType<Src | null> {
    return {
      kind: 'Union',
      name,
      description,
      types,
      resolveType,
    } as UnionType<Src | null>;
  }

  export function InterfaceType<Src>({
    name,
    description,
    interfaces = [],
    fields,
  }: {
    name: string;
    description?: string;
    interfaces?: Array<InterfaceType<any>> | (() => Array<InterfaceType<any>>);
    fields: (self: InterfaceType<Src | null>) => Array<AbstractField<any>>;
  }): InterfaceType<Src | null> {
    const obj: InterfaceType<Src | null> = {
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
  ): OutputType<Array<Src> | null> {
    return {
      kind: 'List',
      ofType: ofType as any,
    };
  }

  export function ListInput<Src>(
    ofType: InputType<Src>
  ): InputType<Array<Src> | null> {
    return {
      kind: 'ListInput',
      ofType: ofType as any,
    };
  }

  export function NonNull<Src>(
    ofType: OutputType<Src | null | undefined>
  ): OutputType<Src>;
  export function NonNull<Src>(ofType: OutputType<Src | null>): OutputType<Src>;
  export function NonNull(ofType: unknown): unknown {
    return {
      kind: 'NonNull',
      ofType: ofType as any,
    };
  }

  export function NonNullInput<Src>(
    ofType: InputType<Src | null | undefined>
  ): InputType<Src>;
  export function NonNullInput<Src>(
    ofType: InputType<Src | null>
  ): InputType<Src>;
  export function NonNullInput(ofType: unknown): unknown {
    return {
      kind: 'NonNullInput',
      ofType: ofType as any,
    };
  }

  export function Query<RootSrc>({
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

  export function Mutation<RootSrc>({
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
    args?: ArgMap<Arg>;
    description?: string;
    deprecationReason?: string;
    subscribe: (
      src: RootSrc,
      args: TOfArgMap<ArgMap<Arg>>,
      ctx: GqlContext,
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

  export function Subscription<Src>({
    name = 'Subscription',
    fields,
  }: {
    name?: string;
    fields: () => [
      SubscriptionField<Src, any, any>,
      ...SubscriptionField<Src, any, any>[]
    ];
  }): SubscriptionObjectType<Src> {
    return {
      kind: 'SubscriptionObject',
      name,
      fields,
    };
  }
}
