import * as define from './define';
export { buildGraphQLSchema, toGraphQLInputType, toGraphQOutputType } from './build';

export default {
  String: define.StringType,
  Int: define.IntType,
  Float: define.FloatType,
  ID: define.ID,
  IDInt: define.IntIDType,
  IDString: define.StringIDType,
  Boolean: define.BooleanType,
  scalarType: define.scalarType,
  enumType: define.enumType,
  objectType: define.objectType,
  inputObjectType: define.inputObjectType,
  unionType: define.unionType,
  interfaceType: define.interfaceType,
  NonNull: define.NonNull,
  NonNullInput: define.NonNullInput,
  List: define.List,
  ListInput: define.ListInput,
  field: define.field,
  fieldFast: define.fieldFast,
  abstractField: define.abstractField,
  queryType: define.queryType,
  mutationType: define.mutationType
};
