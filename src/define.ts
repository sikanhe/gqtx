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
} from './types';

type ExtensionsMap = {
  field?: {
    [key: string]: any;
  };
  objectType?: {
    [key: string]: any;
  };
};

type ResolvePartialMandatory<Src, Arg, Ctx, Out> = {
  resolve: (
    src: Src,
    args: TOfArgMap<ArgMap<Arg>>,
    ctx: Ctx,
    info: graphql.GraphQLResolveInfo
  ) => PromiseOrValue<Out>;
};

type ResolvePartialOptional<Src, Arg, Ctx, Out> = {
  resolve?: (
    src: Src,
    args: TOfArgMap<ArgMap<Arg>>,
    ctx: Ctx,
    info: graphql.GraphQLResolveInfo
  ) => PromiseOrValue<Out>;
};

export type Factory<Ctx, TExtensionsMap extends ExtensionsMap> = {
  String: Scalar<string | null | undefined>;
  Int: Scalar<number | null | undefined>;
  Float: Scalar<number | null | undefined>;
  Boolean: Scalar<boolean | null | undefined>;
  ID: Scalar<string | null | undefined>;
  scalarType<Src>({
    name,
    description,
    serialize,
    parseValue,
    parseLiteral,
  }: {
    name: string;
    description?: string | undefined;
    serialize: (src: Src) => any;
    parseValue?: ((value: unknown) => Src | null) | undefined;
    parseLiteral?: ((value: graphql.ValueNode) => Src | null) | undefined;
  }): Scalar<Src | null>;
  enumType<Src>({
    name,
    description,
    values,
  }: {
    name: string;
    description?: string | undefined;
    values: EnumValue<Src>[];
  }): Enum<Src | null>;
  arg<Src>(
    type: InputType<Src>,
    description?: string | undefined
  ): Argument<Src>;
  defaultArg<Src>(
    type: InputType<Src>,
    defaultArg: Exclude<Src, null | undefined>,
    description?: string | undefined
  ): DefaultArgument<Exclude<Src, null | undefined>>;

  field<TKey extends string, Src, Arg, Out>(
    opts: {
      name: TKey;
      type: OutputType<Ctx, Out>;
      args?: ArgMap<Arg> | undefined;
      description?: string | undefined;
      deprecationReason?: string | undefined;
      extensions?: TExtensionsMap['field'];
    } & (TKey extends keyof Src
      ? Src[TKey] extends Out
        ? ResolvePartialOptional<Src, Arg, Ctx, Out>
        : ResolvePartialMandatory<Src, Arg, Ctx, Out>
      : ResolvePartialMandatory<Src, Arg, Ctx, Out>)
  ): Field<Ctx, Src, any, any>;

  abstractField<Out_1>(opts: {
    name: string;
    type: OutputType<Ctx, Out_1>;
    description?: string | undefined;
    deprecationReason?: string | undefined;
    args?: ArgMap<unknown> | undefined;
  }): AbstractField<Ctx, Out_1>;
  objectType<Src, Ctx = any>({
    name,
    description,
    interfaces,
    fields,
    isTypeOf,
    extensions,
  }: {
    name: string;
    description?: string | undefined;
    interfaces?: Interface<Ctx, any>[] | undefined;
    fields: (
      self: OutputType<Ctx, Src | null>
    ) => [Field<Ctx, Src, any, {}>, ...Field<Ctx, Src, any, {}>[]];
    isTypeOf?:
      | ((src: any, ctx: Ctx, info: graphql.GraphQLResolveInfo) => boolean)
      | undefined;
    extensions?: TExtensionsMap['objectType'];
  }): ObjectType<Ctx, Src | null>;
  inputObjectType<Src>({
    name,
    description,
    fields,
  }: {
    name: string;
    description?: string | undefined;
    fields: (self: InputType<Src | null>) => InputFieldMap<Src>;
  }): InputObject<Src | null>;
  unionType<Src>({
    name,
    description,
    types,
    resolveType,
  }: {
    name: string;
    description?: string | undefined;
    types: ObjectType<Ctx, any>[];
    resolveType: (src: Src) => ObjectType<any, any>;
  }): Union<Ctx, Src | null>;
  interfaceType<Src>({
    name,
    description,
    interfaces,
    fields,
  }: {
    name: string;
    description?: string | undefined;
    interfaces?: Interface<Ctx, any>[] | undefined;
    fields: (self: Interface<Ctx, Src | null>) => AbstractField<Ctx, any>[];
  }): Interface<Ctx, Src | null>;
  List<Src>(ofType: OutputType<Ctx, Src>): OutputType<Ctx, Src[] | null>;
  ListInput<Src>(ofType: InputType<Src>): InputType<Src[] | null>;

  NonNull<Src>(ofType: OutputType<Ctx, Src | null | undefined>): OutputType<Ctx, Src>;
  NonNull<Src>(ofType: OutputType<Ctx, Src | null>): OutputType<Ctx, Src>;

  NonNullInput<Src>(ofType: InputType<Src | null | undefined>): InputType<Src>;
  NonNullInput<Src>(ofType: InputType<Src | null>): InputType<Src>;
  queryType<RootSrc>({
    name,
    fields,
  }: {
    name?: string | undefined;
    fields: () => [
      Field<Ctx, RootSrc, any, {}>,
      ...Field<Ctx, RootSrc, any, {}>[]
    ];
  }): ObjectType<Ctx, RootSrc>;
  mutationType<RootSrc>({
    name,
    fields,
  }: {
    name?: string | undefined;
    fields: () => [
      Field<Ctx, RootSrc, any, {}>,
      ...Field<Ctx, RootSrc, any, {}>[]
    ];
  }): ObjectType<Ctx, RootSrc>;
  subscriptionField<RootSrc, Out_2, Arg_1>({
    name,
    type,
    args,
    subscribe,
    description,
    deprecationReason,
  }: {
    name: string;
    type: OutputType<Ctx, Out_2>;
    args?: ArgMap<Arg_1> | undefined;
    description?: string | undefined;
    deprecationReason?: string | undefined;
    subscribe: (
      src: RootSrc,
      args: TOfArgMap<ArgMap<Arg_1>>,
      ctx: Ctx,
      info: graphql.GraphQLResolveInfo
    ) => PromiseOrValue<AsyncIterableIterator<Out_2>>;
  }): SubscriptionField<Ctx, RootSrc, Arg_1, Out_2>;
  subscriptionType<Src>({
    name,
    fields,
  }: {
    name?: string | undefined;
    fields: () => [
      SubscriptionField<Ctx, Src, any, any>,
      ...SubscriptionField<Ctx, Src, any, any>[]
    ];
  }): SubscriptionObject<Ctx, Src>;
};

function builtInScalar<Src>(
  builtInType: graphql.GraphQLScalarType
): Scalar<Src | null> {
  return {
    kind: 'Scalar',
    builtInType,
  };
}

export function createTypesFactory<
  Ctx = undefined,
  TExtensions extends ExtensionsMap = {}
>(): Factory<Ctx, TExtensions> {
  return {
    String: builtInScalar<string>(graphql.GraphQLString),
    Int: builtInScalar<number>(graphql.GraphQLInt),
    Float: builtInScalar<number>(graphql.GraphQLFloat),
    Boolean: builtInScalar<boolean>(graphql.GraphQLBoolean),
    ID: builtInScalar<string>(graphql.GraphQLID),
    scalarType<Src>({
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
          serialize,
          parseLiteral,
          parseValue,
        },
      };
    },
    enumType<Src>({
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
    },

    arg<Src>(type: InputType<Src>, description?: string): Argument<Src> {
      return {
        kind: 'Argument',
        type,
        description,
      };
    },
    defaultArg<Src>(
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
    },

    field: ({ name, type, resolve, args, ...options }) => ({
      kind: 'Field',
      name,
      type,
      args: args ?? {},
      // if no resolver is defined we fallback to the default GraphQL resolver which is (src) => src[fieldName]
      resolve: typeof resolve === 'function' ? resolve : undefined,
      ...options,
    }),

    abstractField<Out>(opts: {
      name: string;
      type: OutputType<Ctx, Out>;

      description?: string;
      deprecationReason?: string;
      args?: ArgMap<unknown>;
    }): AbstractField<Ctx, Out> {
      return {
        kind: 'AbstractField',
        name: opts.name,
        description: opts.description,
        deprecationReason: opts.deprecationReason,
        args: opts.args,
        type: opts.type,
      };
    },
    objectType<Src, Ctx = any>({
      name,
      description,
      interfaces = [],
      fields,
      isTypeOf,
      extensions,
    }: {
      name: string;
      description?: string;
      interfaces?: Array<Interface<Ctx, any>>;
      fields: (
        self: OutputType<Ctx, Src | null>
      ) => Array<Field<Ctx, Src, any>>;
      isTypeOf?: (
        src: any,
        ctx: Ctx,
        info: graphql.GraphQLResolveInfo
      ) => boolean;
      extensions?: TExtensions['objectType'] extends undefined
        ? Record<string, any>
        : TExtensions['objectType'];
    }): ObjectType<Ctx, Src | null> {
      const obj: ObjectType<Ctx, Src | null> = {
        kind: 'ObjectType',
        name,
        description,
        interfaces,
        fieldsFn: undefined as any,
        isTypeOf,
        extensions,
      };

      obj.fieldsFn = () => fields(obj) as any;
      return obj;
    },
    inputObjectType<Src>({
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
    },
    unionType<Src>({
      name,
      description,
      types,
      resolveType,
    }: {
      name: string;
      description?: string;
      types: Array<ObjectType<Ctx, any>>;
      resolveType: (src: Src) => ObjectType<any, any>;
    }): Union<Ctx, Src | null> {
      return {
        kind: 'Union',
        name,
        description,
        types,
        resolveType,
      } as Union<Ctx, Src | null>;
    },
    interfaceType<Src>({
      name,
      description,
      interfaces = [],
      fields,
    }: {
      name: string;
      description?: string;
      interfaces?: Array<Interface<Ctx, any>>;
      fields: (
        self: Interface<Ctx, Src | null>
      ) => Array<AbstractField<Ctx, any>>;
    }): Interface<Ctx, Src | null> {
      const obj: Interface<Ctx, Src | null> = {
        kind: 'Interface',
        name,
        description,
        interfaces,
        fieldsFn: undefined as any,
      };

      obj.fieldsFn = () => fields(obj) as any;
      return obj;
    },
    List<Src>(
      ofType: OutputType<Ctx, Src>
    ): OutputType<Ctx, Array<Src> | null> {
      return {
        kind: 'List',
        ofType: ofType as any,
      };
    },
    ListInput<Src>(ofType: InputType<Src>): InputType<Array<Src> | null> {
      return {
        kind: 'ListInput',
        ofType: ofType as any,
      };
    },
    NonNull<Src>(ofType: OutputType<Ctx, Src | null>): OutputType<Ctx, Src> {
      return {
        kind: 'NonNull',
        ofType: ofType as any,
      };
    },
    NonNullInput<Src>(ofType: InputType<Src | null>): InputType<Src> {
      return {
        kind: 'NonNullInput',
        ofType: ofType as any,
      };
    },
    queryType<RootSrc>({
      name = 'Query',
      fields,
    }: {
      name?: string;
      fields: () => Array<Field<Ctx, RootSrc, any>>;
    }): ObjectType<Ctx, RootSrc> {
      return {
        kind: 'ObjectType',
        name,
        interfaces: [],
        fieldsFn: fields,
      };
    },
    mutationType<RootSrc>({
      name = 'Mutation',
      fields,
    }: {
      name?: string;
      fields: () => Array<Field<Ctx, RootSrc, any>>;
    }): ObjectType<Ctx, RootSrc> {
      return {
        kind: 'ObjectType',
        name,
        interfaces: [],
        fieldsFn: fields,
      };
    },
    subscriptionField<RootSrc, Out, Arg>({
      name,
      type,
      args = {} as ArgMap<Arg>,
      subscribe,
      description,
      deprecationReason,
    }: {
      name: string;
      type: OutputType<Ctx, Out>;
      args?: ArgMap<Arg> | undefined;
      description?: string | undefined;
      deprecationReason?: string | undefined;
      subscribe: (
        src: RootSrc,
        args: TOfArgMap<ArgMap<Arg>>,
        ctx: Ctx,
        info: graphql.GraphQLResolveInfo
      ) => PromiseOrValue<AsyncIterableIterator<Out>>;
    }): SubscriptionField<Ctx, RootSrc, Arg, Out> {
      return {
        kind: 'SubscriptionField',
        name,
        type,
        args,
        subscribe,
        resolve: (value: Out) => value,
        description,
        deprecationReason,
      };
    },
    subscriptionType<Src>({
      name = 'Subscription',
      fields,
    }: {
      name?: string;
      fields: () => Array<SubscriptionField<Ctx, Src, unknown, unknown>>;
    }): SubscriptionObject<Ctx, Src> {
      return {
        kind: 'SubscriptionObject',
        name,
        fields,
      };
    },
  };
}
