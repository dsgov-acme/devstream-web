import { SchemaModel } from '@dsg/shared/data-access/http';
import { ITransactionMetaData } from '../form/form.model';
export class TransactionMetadataModel implements SchemaModel<ITransactionMetaData> {
  public name = '';
  public schemaKey = '';
  public createdBy = '';
  public lastUpdatedBy = '';
  public description = '';
  public transactionDefinitionKey = '';
  public formKey = '';
  constructor(TransactionMetadataSchema: ITransactionMetaData) {
    this.fromSchema(TransactionMetadataSchema);
  }
  public toSchema(): ITransactionMetaData {
    return {
      createdBy: this.createdBy,
      description: this.description,
      formKey: this.formKey,
      lastUpdatedBy: this.lastUpdatedBy,
      name: this.name,
      schemaKey: this.schemaKey,
      transactionDefinitionKey: this.transactionDefinitionKey,
    };
  }

  public fromSchema(TransactionMetadataSchema: ITransactionMetaData) {
    this.name = TransactionMetadataSchema.name;
    this.schemaKey = TransactionMetadataSchema.schemaKey;
    this.createdBy = TransactionMetadataSchema.createdBy;
    this.lastUpdatedBy = TransactionMetadataSchema.lastUpdatedBy;
    this.description = TransactionMetadataSchema.description;
    this.transactionDefinitionKey = TransactionMetadataSchema.transactionDefinitionKey;
    this.formKey = TransactionMetadataSchema.formKey;
  }
}
