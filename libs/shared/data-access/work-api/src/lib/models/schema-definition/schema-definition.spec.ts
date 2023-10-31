import { SchemaDefinitionMock } from './schema-definition.mock';
import { SchemaDefinitionModel } from './schema-definition.model';

describe('SchemaDefinitionModel', () => {
  let schemaDefinitionModel: SchemaDefinitionModel;

  beforeEach(() => {
    schemaDefinitionModel = new SchemaDefinitionModel(SchemaDefinitionMock);
  });

  describe('fromSchema', () => {
    test('should set all public properties', () => {
      expect(schemaDefinitionModel.attributes).toEqual(SchemaDefinitionMock.attributes);
      expect(schemaDefinitionModel.createdBy).toEqual(SchemaDefinitionMock.createdBy);
      expect(schemaDefinitionModel.createdTimestamp).toEqual(SchemaDefinitionMock.createdTimestamp);
      expect(schemaDefinitionModel.description).toEqual(SchemaDefinitionMock.description);
      expect(schemaDefinitionModel.key).toEqual(SchemaDefinitionMock.key);
      expect(schemaDefinitionModel.lastUpdatedTimestamp).toEqual(SchemaDefinitionMock.lastUpdatedTimestamp);
      expect(schemaDefinitionModel.name).toEqual(SchemaDefinitionMock.name);
    });
  });

  test('toSchema', () => {
    expect(schemaDefinitionModel.toSchema()).toEqual(SchemaDefinitionMock);
  });
});
