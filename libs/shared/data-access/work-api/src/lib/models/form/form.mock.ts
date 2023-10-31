import { FormioConfigurationTestMock } from '../form-configuration/form-configuration.mock';
import { FormModel, IActiveForm, IForm } from './form.model';

export const FormMock: IForm = {
  configuration: {
    components: FormioConfigurationTestMock,
  },
  configurationSchema: 'formio',
  createdBy: 'CreatedBy',
  description: 'Description',
  formKey: 'FormKey',
  lastUpdatedBy: 'LastUpdatedBy',
  name: 'Name',
  schemaKey: 'SchemaKey',
  taskName: 'TestTask',
  transactionDefinitionKey: 'TransactionDefinitionKey',
};

export const FormListMock: IForm[] = [
  {
    configuration: {
      components: FormioConfigurationTestMock,
    },
    configurationSchema: 'formio',
    createdBy: 'CreatedBy',
    description: 'Description',
    formKey: 'FormKey',
    lastUpdatedBy: 'LastUpdatedBy',
    name: 'Name',
    schemaKey: 'SchemaKey',
    taskName: 'TestTask',
    transactionDefinitionKey: 'TransactionDefinitionKey',
  },
  {
    configuration: {
      components: FormioConfigurationTestMock,
    },
    configurationSchema: 'formio',
    createdBy: 'CreatedBy',
    description: 'Description2',
    formKey: 'FormKey2',
    lastUpdatedBy: 'LastUpdatedBy',
    name: 'Name2',
    schemaKey: 'SchemaKey2',
    taskName: 'TestTask2',
    transactionDefinitionKey: 'TransactionDefinitionKey',
  },
];

export const ToSchemaFormMock: Partial<IForm> = {
  configuration: {
    components: FormioConfigurationTestMock,
  },
  configurationSchema: 'formio',
  description: 'Description',
  formKey: 'FormKey',
  name: 'Name',
  schemaKey: 'SchemaKey',
  taskName: 'TestTask',
  transactionDefinitionKey: 'TransactionDefinitionKey',
};

export const ActiveFormsMock: IActiveForm = {
  ['TestTask']: {
    configuration: FormMock.configuration,
    configurationSchema: 'formio',
    createdBy: '',
    description: '',
    formKey: '',
    lastUpdatedBy: '',
    name: '',
    schemaKey: '',
    transactionDefinitionKey: '',
  },
};

export const FormModelMock = new FormModel({
  configuration: ActiveFormsMock['TestTask'].configuration,
  configurationSchema: 'formio',
  createdBy: '',
  description: '',
  formKey: '',
  lastUpdatedBy: '',
  name: '',
  schemaKey: '',
  taskName: 'TestTask',
  transactionDefinitionKey: '',
});
