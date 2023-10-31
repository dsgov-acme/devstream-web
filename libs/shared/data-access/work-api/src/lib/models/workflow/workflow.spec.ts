import { WorkflowMock } from './workflow.mock';
import { WorkflowModel } from './workflow.model';

describe('WorkflowModel', () => {
  let workflowModel: WorkflowModel;

  beforeEach(() => {
    workflowModel = new WorkflowModel(WorkflowMock);
  });

  describe('fromSchema', () => {
    test('should set all public properties', () => {
      expect(workflowModel.description).toEqual(WorkflowMock.description);
      expect(workflowModel.name).toEqual(WorkflowMock.name);
      expect(workflowModel.processDefinitionId).toEqual(WorkflowMock.processDefinitionId);
      expect(workflowModel.processDefinitionKey).toEqual(WorkflowMock.processDefinitionKey);
    });
  });

  test('toSchema', () => {
    expect(workflowModel.toSchema()).toEqual(WorkflowMock);
  });
});
