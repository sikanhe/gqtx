import * as gql from 'graphql';

type OutputType<Ctx, Src> =
  | Scalar<Src>
  | Enum<Src>
  | ObjectType<Ctx, Src>
  | Union<Ctx, Src>
  | Interface<Ctx, Src>
  | ListType<Ctx, Src>
  | NonNullType<Ctx, Src>

interface ListType<Ctx, Src> extends List<Ctx, OutputType<Ctx, Src>> {}
interface NonNullType<Ctx, Src> extends NonNull<Ctx, OutputType<Ctx, Src>> {}

type InputType<Src> =
  | Scalar<Src>
  | Enum<Src>
  | InputObject<Src>
  | ListInputType<Src>
  | NonNullInputType<Src>

interface ListInputType<Src> extends ListInput<InputType<Src>> {}
interface NonNullInputType<Src> extends NonNullInput<InputType<Src>> {}

type AllType<Ctx, Src> = OutputType<Ctx, Src> | InputType<Src>;

type Scalar<Src> = {
  kind: 'Scalar';
  name: string;
  description?: string;
  serialize: (value: any) => Src | null;
  parseValue?: (value: any) => Src | null;
  parseLiteral?: (valueAST: gql.ValueNode) => Src | null;
};

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

type ArgMap<T> = {
  [K in keyof T]: Argument<T[K]>;
};

type TOfArgMap<TArgMap> = {
  [K in keyof TArgMap]: TArgMap[K] extends Argument<infer Src> ? Src : never;
};

type Field<Ctx, Src, TArg extends object, Out> = {
  kind: 'Field';
  name: string;
  description?: string;
  type: OutputType<Ctx, Out>;
  arguments: ArgMap<TArg>;
  resolve: (src: Src, args: TOfArgMap<ArgMap<TArg>>, ctx: Ctx) => Out | Promise<Out>;
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
  resolveType?: (src: Src) => ObjectType<Ctx, Src>;
};

type Union<Ctx, Src> = {
  kind: 'Union';
  name: string;
  types: Array<ObjectType<Ctx, Src>>;
  resolveType: (src: Src) => ObjectType<Ctx, Src>;
};

type Schema<Ctx> = {
  query: ObjectType<Ctx, void>;
};

export const StringType: Scalar<string | null> = {
  kind: 'Scalar',
  name: 'String',
  serialize: a => a.toString(),
};

export const IntType: Scalar<number | null> = {
  kind: 'Scalar',
  name: 'Int',
  serialize: a => Number(a),
};

export const FloatType: Scalar<number | null> = {
  kind: 'Scalar',
  name: 'Float',
  serialize: a => Number(a),
};

export const BooleanType: Scalar<boolean | null> = {
  kind: 'Scalar',
  name: 'Boolean',
  serialize: a => Boolean(a),
};

export const IDType: Scalar<string | null> = {
  kind: 'Scalar',
  name: 'ID',
  serialize: a => String(a),
};

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
  resolve: (src: Src, args: TOfArgMap<ArgMap<Arg>>, ctx: Ctx) => Out | Promise<Out>;
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
    description?: string
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

export function objectType<Src, Ctx = any>(name: string, {
  description,
  interfaces = [],
  fields,
}: {
  description?: string;
  interfaces?: Array<Interface<Ctx, any>>;
  fields: (self: OutputType<Ctx, Src | null>) => Array<Field<Ctx, Src, any, unknown>>;
}): ObjectType<Ctx, Src | null> {
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

export function inputObjectType<Src>(name: string, {
  description,
  fields,
}: {
  description?: string;
  fields: (self: InputType<Src>) => ArgMap<Src>;
}): InputObject<Src | null> {
  let inputObj: InputObject<Src> = {
    kind: 'InputObject',
    name,
    description,
    fieldsFn: null as any,
  };

  inputObj.fieldsFn = () => fields(inputObj);
  return inputObj;
}

export function unionType<Src, Ctx>(name: string, {
  types,
  resolveType,
}: {
  types: Array<ObjectType<Ctx, Src>>;
  resolveType: (src: any) => ObjectType<any, any>;
}): Union<Ctx, Src> {
  return {
    kind: 'Union',
    name,
    types,
    resolveType,
  };
}

export function interfaceType<Src, Ctx = any>(  name: string, {
  description,
  fields
}:
{
  description?: string;
  fields: (self: Interface<Ctx, Src | null>) => Array<AbstractField<Ctx, any>>
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
  fields: () => Array<Field<Ctx, void, any, unknown>>;
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
  fields: () => Array<Field<Ctx, void, any, unknown>>;
}): ObjectType<Ctx, void> {
  return {
    kind: 'ObjectType',
    name,
    interfaces: [],
    fieldsFn: fields,
  };
}

export function toSchema<Ctx>(schema: Schema<Ctx>): gql.GraphQLSchema {
  return new gql.GraphQLSchema({
    query: toGraphQOutputType(schema.query, new Map()) as any,
  });
}

function toGraphQLInputType<Src>(
  t: InputType<Src>,
  typeMap: Map<AllType<any, any>, gql.GraphQLType>
): gql.GraphQLInputType {
  if (typeMap.get(t)) {
    return typeMap.get(t) as gql.GraphQLInputType;
  }

  switch (t.kind) {
    case 'Scalar':
    case 'Enum':
      return toGraphQOutputType(t, typeMap) as gql.GraphQLInputType;
    case 'NonNull':
      return new gql.GraphQLNonNull(toGraphQLInputType(t.ofType, typeMap));
    case 'List':
      return new gql.GraphQLList(toGraphQLInputType(t.ofType, typeMap));
    case 'InputObject':
      const fields = t.fieldsFn();
      const gqlFieldConfig: gql.GraphQLInputFieldConfigMap = {};

      Object.keys(fields).forEach(k => {
        const field = (fields as any)[k];
        console.log(field);
        gqlFieldConfig[k] = {
          type: toGraphQLInputType(field.type, typeMap),
          description: field.description,
        } as gql.GraphQLInputFieldConfig;
      });

      const obj = new gql.GraphQLInputObjectType({
        name: t.name,
        fields: gqlFieldConfig as any,
      });

      typeMap.set(t, obj);
      return obj;
  }
}

function toGraphQOutputType<Ctx, Src>(
  t: OutputType<Ctx, Src>,
  typeMap: Map<AllType<any, any>, gql.GraphQLType>
): gql.GraphQLOutputType {
  console.log(t);
  if (typeMap.get(t)) {
    return typeMap.get(t) as gql.GraphQLOutputType;
  }

  switch (t.kind) {
    case 'Scalar':
      let scalar;

      if (t.name === 'String') {
        scalar = gql.GraphQLString;
      } else if (t.name === 'Int') {
        scalar = gql.GraphQLInt;
      } else if (t.name === 'Float') {
        scalar = gql.GraphQLFloat;
      } else if (t.name === 'Boolean') {
        scalar = gql.GraphQLBoolean;
      } else if (t.name === 'ID') {
        scalar = gql.GraphQLID;
      } else {
        scalar = new gql.GraphQLScalarType({
          name: t.name,
          description: t.description,
          serialize: t.serialize,
          parseLiteral: t.parseLiteral,
          parseValue: t.parseValue
        });
      }

      typeMap.set(t, scalar);
      return scalar;
    case 'Enum':
      const enumT = new gql.GraphQLEnumType({
        name: t.name,
        description: t.description,
        values: t.values.reduce(
          (acc, val) => {
            acc[val.name] = { value: val.value };
            return acc;
          },
          {} as { [key: string]: any }
        ),
      });
      typeMap.set(t, enumT);
      return enumT;
    case 'NonNull':
      return new gql.GraphQLNonNull(toGraphQOutputType(t.ofType, typeMap));
    case 'List':
      return new gql.GraphQLList(toGraphQOutputType(t.ofType, typeMap));
    case 'ObjectType':
      const obj = new gql.GraphQLObjectType({
        name: t.name,
        interfaces: t.interfaces.map(intf => toGraphQOutputType(intf, typeMap)) as any,
        fields: () => {
          const fields = t.fieldsFn();
          const gqlFieldConfig: gql.GraphQLFieldConfigMap<Src, Ctx> = {};

          function mapArgs<T>(args: ArgMap<T>): any {
            const result = {} as gql.GraphQLFieldConfigArgumentMap;

            Object.keys(args).forEach(k => {
              result[k] = {
                type: toGraphQLInputType((args as any)[k].type, typeMap),
                description: (args as any)[k].description
              };
            });

            return result;
          }

          fields.forEach(field => {
            gqlFieldConfig[field.name] = {
              type: toGraphQOutputType(field.type, typeMap),
              description: field.description,
              resolve: field.resolve,
              args: mapArgs(field.arguments),
            } as gql.GraphQLFieldConfig<Src, Ctx, any>;
          });
          return gqlFieldConfig;
        },
      });

      typeMap.set(t, obj);
      return obj;

    case 'Union':
      const union = new gql.GraphQLUnionType({
        name: t.name,
        types: t.types.map(t => toGraphQOutputType(t, typeMap)) as any,
        resolveType: (any: any) => typeMap.get(t.resolveType(any)) as any,
      });

      typeMap.set(t, union);
      return union;
    case 'Interface':
      const intf = new gql.GraphQLInterfaceType({
        name: t.name,
        fields: () => {
          const fields = t.fieldsFn();
          const result: gql.GraphQLFieldConfigMap<Src, Ctx> = {};

          fields.forEach(field => {
            result[field.name] = {
              type: toGraphQOutputType(field.type, typeMap),
              description: field.description,
            };
          });

          return result;
        },
      });
      
      typeMap.set(t, intf);
      return intf;
  }
}
