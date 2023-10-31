import { SchemaTreeAttributesMock, SchemaTreeDefinitionMock } from './schema-tree.mock';
import { SchemaTreeDefinitionModel } from './schema-tree.model';

interface TreeNode {
  children: TreeNode[];
  expanded: boolean;
  icon?: string;
  key: string;
  label: string;
}

describe('SchemaTreeDefinitionModel', () => {
  describe('assignIcon', () => {
    it('should return the correct icon for each type', () => {
      expect(SchemaTreeDefinitionModel.assignIcon('String')).toEqual('short_text');
      expect(SchemaTreeDefinitionModel.assignIcon('List')).toEqual('format_list_bulleted');
      expect(SchemaTreeDefinitionModel.assignIcon('Boolean')).toEqual('radio_button_checked');
      expect(SchemaTreeDefinitionModel.assignIcon('DynamicEntity')).toEqual('schema');
      expect(SchemaTreeDefinitionModel.assignIcon('Integer')).toEqual('money');
      expect(SchemaTreeDefinitionModel.assignIcon('Number')).toEqual('money');
      expect(SchemaTreeDefinitionModel.assignIcon('BigDecimal')).toEqual('decimal_increase');
      expect(SchemaTreeDefinitionModel.assignIcon('LocalDate')).toEqual('calendar_today');
      expect(SchemaTreeDefinitionModel.assignIcon('LocalTime')).toEqual('schedule');
      expect(SchemaTreeDefinitionModel.assignIcon('Document')).toEqual('description');
      expect(SchemaTreeDefinitionModel.assignIcon('Unknown Type')).toEqual('short_text');
    });
  });

  describe('isAttribute', () => {
    it('should return true if the schema is an attribute', () => {
      expect(SchemaTreeDefinitionModel.isAttribute(SchemaTreeAttributesMock)).toEqual(true);
    });
  });

  describe('toTree', () => {
    it('should convert a schema tree definition to a tree node', () => {
      const schemaTree = new SchemaTreeDefinitionModel(SchemaTreeDefinitionMock);

      const expectedTree: TreeNode = {
        children: [
          {
            children: [],
            expanded: true,
            icon: 'short_text',
            key: 'firstName',
            label: 'firstName',
          },
          {
            children: [
              {
                children: [],
                expanded: true,
                icon: 'short_text',
                key: 'address',
                label: 'address',
              },
              {
                children: [],
                expanded: true,
                icon: 'short_text',
                key: 'city',
                label: 'city',
              },
            ],
            expanded: true,
            icon: 'schema',
            key: 'CommonPersonalInformation',
            label: 'CommonPersonalInformation',
          },
          {
            children: [],
            expanded: true,
            icon: 'short_text',
            key: 'lastName',
            label: 'lastName',
          },
        ],
        expanded: true,
        icon: 'schema',
        key: 'FinancialBenefit',
        label: 'FinancialBenefit',
      };

      const result = SchemaTreeDefinitionModel.toTree(schemaTree);

      expect(result).toEqual(expectedTree);
    });
  });

  describe('fromSchema', () => {
    test('should set all public properties', () => {
      const schemaTreeDefnitionModel = new SchemaTreeDefinitionModel(SchemaTreeDefinitionMock);

      expect(schemaTreeDefnitionModel.attributes).toEqual(SchemaTreeDefinitionMock.attributes);
      expect(schemaTreeDefnitionModel.createdBy).toEqual(SchemaTreeDefinitionMock.createdBy);
      expect(schemaTreeDefnitionModel.createdTimestamp).toEqual(SchemaTreeDefinitionMock.createdTimestamp);
      expect(schemaTreeDefnitionModel.description).toEqual(SchemaTreeDefinitionMock.description);
      expect(schemaTreeDefnitionModel.key).toEqual(SchemaTreeDefinitionMock.key);
      expect(schemaTreeDefnitionModel.lastUpdatedTimestamp).toEqual(SchemaTreeDefinitionMock.lastUpdatedTimestamp);
      expect(schemaTreeDefnitionModel.name).toEqual(SchemaTreeDefinitionMock.name);
    });
  });

  test('toSchema', () => {
    const schemaTreeDefnitionModel = new SchemaTreeDefinitionModel(SchemaTreeDefinitionMock);

    expect(schemaTreeDefnitionModel.toSchema()).toEqual(SchemaTreeDefinitionMock);
  });
});
