import { TransactionMock, TransactionToSchemaMock } from './transaction.mock';
import { TransactionModel } from './transaction.model';

describe('TransactionModel', () => {
  let transactionModel: TransactionModel;

  beforeEach(() => {
    transactionModel = new TransactionModel(TransactionMock);
  });

  describe('fromSchema', () => {
    test('should set all public properties', () => {
      expect(transactionModel.createdBy).toEqual(TransactionMock.createdBy);
      expect(transactionModel.createdByDisplayName).toEqual(TransactionMock.createdByDisplayName);
      expect(transactionModel.createdTimestamp).toEqual(TransactionMock.createdTimestamp);
      expect(transactionModel.data).toEqual(TransactionMock.data);
      expect(transactionModel.externalId).toEqual(TransactionMock.externalId);
      expect(transactionModel.id).toEqual(TransactionMock.id);
      expect(transactionModel.lastUpdatedTimestamp).toEqual(TransactionMock.lastUpdatedTimestamp);
      expect(transactionModel.priority).toEqual(TransactionMock.priority);
      expect(transactionModel.processInstanceId).toEqual(TransactionMock.processInstanceId);
      expect(transactionModel.status).toEqual(TransactionMock.status);
      expect(transactionModel.subjectUserDisplayName).toEqual(TransactionMock.subjectUserDisplayName);
      expect(transactionModel.subjectUserId).toEqual(TransactionMock.subjectUserId);
      expect(transactionModel.submittedOn).toEqual(TransactionMock.submittedOn);
      expect(transactionModel.transactionDefinitionId).toEqual(TransactionMock.transactionDefinitionId);
      expect(transactionModel.transactionDefinitionKey).toEqual(TransactionMock.transactionDefinitionKey);
    });
  });

  test('toSchema', () => {
    expect(transactionModel.toSchema()).toEqual(TransactionToSchemaMock);
  });

  test('toDataSchema', () => {
    expect(transactionModel.toDataSchema()).toEqual({ data: TransactionToSchemaMock.data });
  });

  test('toPrioritySchema', () => {
    expect(transactionModel.toPrioritySchema()).toEqual({ priority: TransactionToSchemaMock.priority });
  });
  test('toAssignedToSchema', () => {
    expect(transactionModel.toAssignedToSchema()).toEqual({ assignedTo: TransactionToSchemaMock.assignedTo });
  });
  test('toActionSchema', () => {
    expect(transactionModel.toActionSchema('approve')).toEqual({ action: 'approve' });
  });
});
