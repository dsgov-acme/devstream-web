import { TransactionMetadataMock } from './transaction-metadata.mock';
import { TransactionMetadataModel } from './transaction-metadata.model';

describe('TransactionMetadataModel', () => {
  let transactionMetadataModel: TransactionMetadataModel;

  beforeEach(() => {
    transactionMetadataModel = new TransactionMetadataModel(TransactionMetadataMock);
  });

  describe('fromSchema', () => {
    test('should set all public properties', () => {
      expect(transactionMetadataModel.name).toEqual(TransactionMetadataMock.name);
      expect(transactionMetadataModel.schemaKey).toEqual(TransactionMetadataMock.schemaKey);
      expect(transactionMetadataModel.createdBy).toEqual(TransactionMetadataMock.createdBy);
      expect(transactionMetadataModel.lastUpdatedBy).toEqual(TransactionMetadataMock.lastUpdatedBy);
      expect(transactionMetadataModel.description).toEqual(TransactionMetadataMock.description);
    });
  });

  test('toSchema', () => {
    expect(transactionMetadataModel.toSchema()).toEqual(TransactionMetadataMock);
  });
});
