import { IProcessingResultSchema } from '@dsg/shared/data-access/document-api';
import { IPaginationResponse, IPagingMetadata, SchemaModel } from '@dsg/shared/data-access/http';

export interface TransactionListSchema {
  items: ITransaction[];
  pagingMetadata: IPagingMetadata;
}

export interface ICustomerProvidedDocument {
  active: boolean;
  dataPath: string;
  id: string;
  isErrorTooltipOpen: boolean;
  label?: string;
  processingResult?: IProcessingResultSchema[];
  rejectionReasons?: string[];
  reviewStatus: string;
  reviewedBy?: string;
  reviewedOn?: string;
  shouldDisplayErrors?: boolean;
  transaction: string;
  reviewedByDisplayName?: string;
}

export interface ITransaction {
  action?: string;
  assignedTo?: string;
  createdBy: string;
  createdByDisplayName: string;
  createdTimestamp: string;
  customerProvidedDocuments?: ICustomerProvidedDocument[];
  data: TransactionData;
  externalId: string;
  id: string;
  lastUpdatedTimestamp: string;
  priority: string;
  processInstanceId: string;
  status: string;
  subjectUserDisplayName: string;
  subjectUserId: string;
  submittedOn: string;
  transactionDefinitionId: string;
  transactionDefinitionKey: string;
  transactionDefinitionName: string;
  activeTasks: ITransactionActiveTask[];
}

export interface TransactionTableData {
  assignedTo?: string;
  claimant: string;
  claimType: string;
  createdBy: string;
  createdTimestamp: string;
  customerProvidedDocuments?: ICustomerProvidedDocument[];
  employer: string;
  externalId: string;
  id: string;
  lastUpdatedTimestamp: string;
  priority: string;
  status: string;
  subjectUserId: string;
  transactionDefinitionId: string;
  transactionDefinitionKey: string;
}

export interface TransactionData {
  [key: string]: unknown;
  personalInformation?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
    email?: string;
    currentAddress?: {
      city?: string;
      countryCode?: string;
      postalCode?: string;
      addressLine1?: string;
      stateCode?: string;
    };
  };
  employmentInformation?: {
    jobTitle?: string;
    employerName?: string;
    industry?: string;
    employmentStatus?: string;
  };
}

export interface ITransactionsPaginationResponse<T> extends IPaginationResponse {
  items: T[];
}

export interface UpdateTransactionOptions {
  transactionId: string;
  transaction: Partial<ITransaction>;
  completeTask?: boolean;
  taskId?: string;
  formStepKey?: string;
}

export interface ITransactionActiveTask {
  key: string;
  name: string;
  actions: ActiveTaskAction[];
}

export interface ActiveTaskAction {
  key: string;
  uiLabel: string;
  uiClass: 'Primary' | 'Secondary' | 'Adverse';
}

export class TransactionModel implements SchemaModel<ITransaction, Partial<ITransaction>> {
  public assignedTo? = '';
  public createdBy = '';
  public createdByDisplayName = '';
  public createdTimestamp = '';
  public customerProvidedDocuments?: ICustomerProvidedDocument[] = [];
  public data: TransactionData = {};
  public externalId = '';
  public id = '';
  public lastUpdatedTimestamp = '';
  public priority = '';
  public processInstanceId = '';
  public status!: string;
  public subjectUserDisplayName = '';
  public subjectUserId = '';
  public submittedOn = '';
  public transactionDefinitionId = '';
  public transactionDefinitionKey = '';
  public transactionDefinitionName = '';
  public rejectedDocuments: string[] = [];
  public activeTasks: ITransactionActiveTask[] = [];

  constructor(transactionSchema?: ITransaction) {
    if (transactionSchema) {
      this.fromSchema(transactionSchema);
    }
  }

  public fromSchema(transactionSchema: ITransaction) {
    this.assignedTo = transactionSchema.assignedTo;
    this.createdBy = transactionSchema.createdBy;
    this.createdByDisplayName = transactionSchema.createdByDisplayName;
    this.createdTimestamp = transactionSchema.createdTimestamp;
    this.customerProvidedDocuments = transactionSchema.customerProvidedDocuments;
    this.data = transactionSchema.data;
    this.externalId = transactionSchema.externalId;
    this.id = transactionSchema.id;
    this.lastUpdatedTimestamp = transactionSchema.lastUpdatedTimestamp;
    this.priority = transactionSchema.priority;
    this.processInstanceId = transactionSchema.processInstanceId;
    this.status = transactionSchema.status;
    this.subjectUserDisplayName = transactionSchema.subjectUserDisplayName;
    this.subjectUserId = transactionSchema.subjectUserId;
    this.submittedOn = transactionSchema.submittedOn;
    this.transactionDefinitionId = transactionSchema.transactionDefinitionId;
    this.transactionDefinitionKey = transactionSchema.transactionDefinitionKey;
    this.transactionDefinitionName = transactionSchema.transactionDefinitionName;
    this.rejectedDocuments = this.customerProvidedDocuments?.filter(doc => doc.reviewStatus === 'REJECTED').map(doc => doc.dataPath) || [];
    this.activeTasks = transactionSchema.activeTasks;
  }

  public toSchema(): Partial<ITransaction> {
    return {
      assignedTo: this.assignedTo,
      data: this.data,
      priority: this.priority,
    };
  }

  public toDataSchema(): Partial<ITransaction> {
    return {
      data: this.data,
    };
  }

  public toPrioritySchema(): Partial<ITransaction> {
    return {
      priority: this.priority,
    };
  }

  public toAssignedToSchema(): Partial<ITransaction> {
    return {
      assignedTo: this.assignedTo,
    };
  }

  public toActionSchema(action: string): Partial<ITransaction> {
    return {
      action,
    };
  }
}
