import { SchemaModel } from '@dsg/shared/data-access/http';
import { FormConfigurationModel, IFormConfigurationSchema } from '../form-configuration/form-configuration.model';

export interface FormConfigurationTableData {
  description: string;
  name: string;
  formKey: string;
}

export interface IForm {
  configuration: {
    components: IFormConfigurationSchema[];
  };
  configurationSchema: string;
  description: string;
  taskName: string;
  name: string;
  schemaKey: string;
  createdBy: string;
  lastUpdatedBy: string;
  transactionDefinitionKey: string;
  formKey: string;
}

export interface ITransactionMetaData {
  name: string;
  schemaKey: string;
  createdBy: string;
  lastUpdatedBy: string;
  description: string;
  transactionDefinitionKey: string;
  formKey: string;
  mode?: 'Create' | 'Update';
}

export interface ISchemaMetaData {
  name: string;
  schemaKey: string;
  createdBy: string;
  lastUpdatedBy: string;
  description: string;
  status: string;
}

export type IActiveForm = Record<
  string,
  {
    configuration: {
      components: IFormConfigurationSchema[];
    };
    configurationSchema: 'formio';
    createdBy: '';
    description: '';
    formKey: '';
    lastUpdatedBy: '';
    name: '';
    schemaKey: '';
    transactionDefinitionKey: '';
  }
>;

export class FormModel implements SchemaModel<IForm, Partial<IForm>> {
  public formConfigurationModel: FormConfigurationModel = new FormConfigurationModel();
  public taskName = '';
  public name = '';
  public schemaKey = '';
  public createdBy = '';
  public lastUpdatedBy = '';
  public description = '';
  public configurationSchema = '';
  public transactionDefinitionKey = '';
  public formKey = '';
  constructor(formSchema?: IForm) {
    if (formSchema) {
      this.fromSchema(formSchema);
    }
  }

  public fromSchema(formSchema: IForm) {
    this.formConfigurationModel = new FormConfigurationModel(formSchema.configuration.components);
    this.taskName = formSchema.taskName;
    this.formKey = formSchema.formKey;
    this.name = formSchema.name;
    this.schemaKey = formSchema.schemaKey;
    this.createdBy = formSchema.createdBy;
    this.lastUpdatedBy = formSchema.lastUpdatedBy;
    this.description = formSchema.description;
    this.configurationSchema = formSchema.configurationSchema;
    this.transactionDefinitionKey = formSchema.transactionDefinitionKey;
  }

  public toSchema(): Partial<IForm> {
    return {
      configuration: {
        components: this.formConfigurationModel?.toSchema() || [],
      },
      configurationSchema: this.configurationSchema,
      description: this.description,
      formKey: this.formKey,
      name: this.name,
      schemaKey: this.schemaKey,
      taskName: this.taskName,
      transactionDefinitionKey: this.transactionDefinitionKey,
    };
  }
}
