import * as define from './define';
export { buildGraphQLSchema, toGraphQLInputType, toGraphQOutputType } from './build';

export default {
  String: define.StringType,
  Int: define.IntType,
  Float: define.FloatType,
  ID: define.IDType,
  IDInt: define.IntIDType,
  IDString: define.StringIDType,
  Boolean: define.BooleanType,
  scalarType: define.scalarType,
  enumType: define.enumType,
  objectType: define.objectType,
  inputObjectType: define.inputObjectType,
  unionType: define.unionType,
  interfaceType: define.interfaceType,
  defaultArg: define.defaultArg,
  arg: define.arg,
  NonNull: define.NonNull,
  NonNullInput: define.NonNullInput,
  List: define.List,
  ListInput: define.ListInput,
  field: define.field,
  fieldFast: define.fieldFast,
  subscriptionField: define.subscriptionField,
  abstractField: define.abstractField,
  queryType: define.queryType,
  mutationType: define.mutationType,
  subscriptionType: define.subscriptionType
};
