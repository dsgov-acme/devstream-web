import { SchemaModel } from '@dsg/shared/data-access/http';

interface TreeNode {
  children: TreeNode[];
  expanded: boolean;
  icon?: string;
  key: string;
  label: string;
}

export interface ISchemaTreeDefinition {
  attributes: ISchemaTreeDefinitionAttributes[];
  createdBy: string;
  createdTimestamp: string;
  description: string;
  key: string;
  lastUpdatedTimestamp: string;
  name: string;
  id: string;
}

export interface ISchemaTreeDefinitionAttributes {
  constraints: unknown[];
  name: string;
  type: string;
  entitySchema?: string;
  schema?: ISchemaTreeDefinition;
}

export class SchemaTreeDefinitionModel implements SchemaModel<ISchemaTreeDefinition> {
  public attributes: ISchemaTreeDefinitionAttributes[] = [];
  public createdBy = '';
  public createdTimestamp = '';
  public description = '';
  public id = '';
  public key = '';
  public lastUpdatedTimestamp = '';
  public name = '';

  constructor(schemaDefinition?: ISchemaTreeDefinition) {
    if (schemaDefinition) {
      this.fromSchema(schemaDefinition);
    }
  }

  public static assignIcon(type: string): string {
    switch (type) {
      case 'String':
        return 'short_text';
      case 'List':
        return 'format_list_bulleted';
      case 'Boolean':
        return 'radio_button_checked';
      case 'DynamicEntity':
        return 'schema';
      case 'Integer':
        return 'money';
      case 'Number':
        return 'money';
      case 'BigDecimal':
        return 'decimal_increase';
      case 'LocalDate':
        return 'calendar_today';
      case 'LocalTime':
        return 'schedule';
      case 'Document':
        return 'description';
      default:
        return 'short_text';
    }
  }

  public static toTree(schema: ISchemaTreeDefinition): TreeNode {
    const toTreeRecursive = (current: ISchemaTreeDefinition | ISchemaTreeDefinitionAttributes): TreeNode => {
      const root: TreeNode = {
        children: [],
        expanded: true,
        icon: '',
        key: '',
        label: '',
      };

      if (SchemaTreeDefinitionModel.isAttribute(current)) {
        root.icon = SchemaTreeDefinitionModel.assignIcon(current.type);
        root.key = current.name;
        root.label = current.name;
        if (current?.schema) {
          // Only include intermediate attribute node
          // Skip next schema node (current (attribute) -> skip single child (schema) -> many schema children (attributes))
          current.schema.attributes.forEach(attribute => {
            root.children.push(toTreeRecursive(attribute));
          });
        }
      } else {
        // Intermediate schema node
        root.icon = 'schema';
        root.key = current.key;
        root.label = current.key;

        current.attributes.forEach(attribute => {
          root.children.push(toTreeRecursive(attribute));
        });
      }

      return root;
    };

    return toTreeRecursive(schema);
  }

  public static isAttribute(schema: ISchemaTreeDefinition | ISchemaTreeDefinitionAttributes): schema is ISchemaTreeDefinitionAttributes {
    return (schema as ISchemaTreeDefinitionAttributes).type !== undefined;
  }

  public fromSchema(schemaDefinition: ISchemaTreeDefinition) {
    this.attributes = schemaDefinition.attributes;
    this.createdBy = schemaDefinition.createdBy;
    this.createdTimestamp = schemaDefinition.createdTimestamp;
    this.description = schemaDefinition.description;
    this.id = schemaDefinition.id;
    this.key = schemaDefinition.key;
    this.lastUpdatedTimestamp = schemaDefinition.lastUpdatedTimestamp;
    this.name = schemaDefinition.name;
  }

  public toSchema(): ISchemaTreeDefinition {
    return {
      attributes: this.attributes,
      createdBy: this.createdBy,
      createdTimestamp: this.createdTimestamp,
      description: this.description,
      id: this.id,
      key: this.key,
      lastUpdatedTimestamp: this.lastUpdatedTimestamp,
      name: this.name,
    };
  }
}
