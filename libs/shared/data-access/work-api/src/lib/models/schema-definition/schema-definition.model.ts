import { IPaginationResponse, SchemaModel } from '@dsg/shared/data-access/http';

export interface SchemaTableData {
  createdBy: string;
  createdTimestamp: string;
  description: string;
  key: string;
  lastUpdatedTimestamp: string;
  name: string;
  id: string;
}

export interface ISchemaDefinition {
  attributes: ISchemaDefinitionAttributes[];
  createdBy: string;
  createdTimestamp: string;
  description: string;
  key: string;
  lastUpdatedTimestamp: string;
  name: string;
  id: string;
}

export interface ISchemaDefinitionAttributes {
  constraints: unknown[];
  name: string;
  type: string;
}

export interface ISchemasPaginationResponse<T> extends IPaginationResponse {
  items: T[];
}

export class SchemaDefinitionModel implements SchemaModel<ISchemaDefinition> {
  public attributes: ISchemaDefinitionAttributes[] = [];
  public createdBy = '';
  public createdTimestamp = '';
  public description = '';
  public id = '';
  public key = '';
  public lastUpdatedTimestamp = '';
  public name = '';

  constructor(schemaDefinition?: ISchemaDefinition) {
    if (schemaDefinition) {
      this.fromSchema(schemaDefinition);
    }
  }

  public fromSchema(schemaDefinition: ISchemaDefinition) {
    this.attributes = schemaDefinition.attributes;
    this.createdBy = schemaDefinition.createdBy;
    this.createdTimestamp = schemaDefinition.createdTimestamp;
    this.description = schemaDefinition.description;
    this.id = schemaDefinition.id;
    this.key = schemaDefinition.key;
    this.lastUpdatedTimestamp = schemaDefinition.lastUpdatedTimestamp;
    this.name = schemaDefinition.name;
  }

  public toSchema(): ISchemaDefinition {
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
