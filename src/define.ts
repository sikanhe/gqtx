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

type Scalar<Src> = {
  kind: 'Scalar';
  graphqlTypeConfig: graphql.GraphQLScalarTypeConfig<Src, JSON>;
} | {
  kind: 'Scalar';
  builtInType: graphql.GraphQLScalarType
}

type Enum<Src> = {
  kind: 'Enum';
  name: string;
  description?: string;
  values: Array<EnumValue<Src>>;
};

type EnumValue<Src> = {
  name: string;
  description?: string;
  value: Src;
};

type List<Ctx, Src> = {
  kind: 'List';
  ofType: OutputType<Ctx, Src>;
};

type NonNull<Ctx, Src> = {
  kind: 'NonNull';
  ofType: OutputType<Ctx, Src>;
};

type ListInput<Src> = {
  kind: 'List';
  ofType: InputType<Src>;
};

type NonNullInput<Src> = {
  kind: 'NonNull';
  ofType: InputType<Src>;
};

type Argument<Src> = {
  type: InputType<Src>;
  description?: string;
};

export type ArgMap<T> = {
  [K in keyof T]: Argument<T[K]>;
};

type TOfArgMap<TArgMap> = {
  [K in keyof TArgMap]: TArgMap[K] extends Argument<infer Src> ? Src : never;
};

type Field<Ctx, Src, Out, TArg extends object = {}> = {
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

type AbstractField<Ctx, Out> = {
  kind: 'AbstractField';
  name: string;
  description?: string;
  type: OutputType<Ctx, Out>;
};

type ObjectType<Ctx, Src> = {
  kind: 'ObjectType';
  name: string;
  description?: string;
  deprecationReason?: string;
  interfaces: Array<Interface<Ctx, any>>;
  fieldsFn: () => Array<Field<Ctx, Src, any, any>>;
};

type InputObject<Src> = {
  kind: 'InputObject';
  name: string;
  description?: string;
  fieldsFn: () => ArgMap<Src>;
};

type Interface<Ctx, Src> = {
  kind: 'Interface';
  name: string;
  description?: string;
  fieldsFn: () => Array<AbstractField<Ctx, any>>;
  resolveType?: (src: Src) => ObjectType<Ctx, Src | null>;
};

type Union<Ctx, Src> = {
  kind: 'Union';
  name: string;
  types: Array<ObjectType<Ctx, Src>>;
  resolveType: (src: Src) => ObjectType<Ctx, Src>;
};

export type Schema<Ctx> = {
  query: ObjectType<Ctx, void>;
  mutation?: ObjectType<Ctx, void>;
};

export const StringType = builtInScalar<string>(graphql.GraphQLString);
export const IntType = builtInScalar<number>(graphql.GraphQLInt);
export const FloatType = builtInScalar<number>(graphql.GraphQLFloat);
export const BooleanType = builtInScalar<boolean>(graphql.GraphQLBoolean);
export const IntIDType = builtInScalar<number>(graphql.GraphQLID);
export const StringIDType = builtInScalar<string>(graphql.GraphQLID);

export function builtInScalar<Src>(builtInType: graphql.GraphQLScalarType): Scalar<Src | null> {
  return {
    kind: 'Scalar',
    builtInType: builtInType
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

export function field<Ctx, Src, Arg, Out>({
  name,
  type,
  args = {} as ArgMap<Arg>,
  resolve,
}: {
  name: string;
  type: OutputType<Ctx, Out>;
  args?: ArgMap<Arg>;
  resolve: (
    src: Src,
    args: TOfArgMap<ArgMap<Arg>>,
    ctx: Ctx,
    info: graphql.GraphQLResolveInfo
  ) => Out | Promise<Out>;
}): Field<Ctx, Src, any, any> {
  return {
    kind: 'Field',
    name,
    type,
    arguments: args,
    resolve,
  };
}

export function fieldFast<Ctx, Src extends object, K extends keyof Src>(
  name: K,
  type: OutputType<Ctx, Src[K]>,
  opts?: {
    description?: string;
  }
): Field<Ctx, Src, any, any> {
  return {
    kind: 'Field',
    name: String(name),
    type,
    description: opts && opts.description,
    arguments: {},
    resolve: (src: Src) => src[name],
  };
}

export function abstractField<Ctx, Out>(
  name: string,
  type: OutputType<Ctx, Out>,
  description?: string
): AbstractField<Ctx, Out> {
  return {
    kind: 'AbstractField',
    name,
    description,
    type,
  };
}

export function objectType<Src, Ctx = any>(
  name: string,
  {
    description,
    interfaces = [],
    fields,
  }: {
    description?: string;
    interfaces?: Array<Interface<Ctx, any>>;
    fields: (self: OutputType<Ctx, Src | null>) => Array<Field<Ctx, Src, any>>;
  }
): ObjectType<Ctx, Src | null> {
  const obj: ObjectType<Ctx, Src | null> = {
    kind: 'ObjectType',
    name,
    description,
    interfaces,
    fieldsFn: undefined as any,
  };

  obj.fieldsFn = () => fields(obj) as any;
  return obj;
}

export function inputObjectType<Src>(
  name: string,
  {
    description,
    fields,
  }: {
    description?: string;
    fields: (self: InputType<Src | null>) => ArgMap<Src>;
  }
): InputObject<Src | null> {
  let inputObj: InputObject<Src> = {
    kind: 'InputObject',
    name,
    description,
    fieldsFn: null as any,
  };

  inputObj.fieldsFn = () => fields(inputObj);
  return inputObj;
}

export function unionType<Src, Ctx = any>(
  name: string,
  {
    types,
    resolveType,
  }: {
    types: Array<ObjectType<Ctx, any>>;
    resolveType: (src: Src) => ObjectType<any, any>;
  }
): Union<Ctx, Src | null> {
  return {
    kind: 'Union',
    name,
    types,
    resolveType,
  } as Union<Ctx, Src | null>;
}

export function interfaceType<Src, Ctx = any>(
  name: string,
  {
    description,
    fields,
  }: {
    description?: string;
    fields: (self: Interface<Ctx, Src | null>) => Array<AbstractField<Ctx, any>>;
  }
): Interface<Ctx, Src | null> {
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
    kind: 'List',
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
    kind: 'NonNull',
    ofType: ofType as any,
  };
}

export function queryType<Ctx>({
  name = 'Query',
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
