import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpTestingModule, PagingRequestModel } from '@dsg/shared/data-access/http';
import {
  ActiveFormsMock,
  DashboardMock,
  DashboardModel,
  FormConfigurationModel,
  FormMock,
  FormModelMock,
  FormioConfigurationTestMock,
  SchemaDefinitionMock,
  SchemaDefinitionModel,
  TransactionDefinitionMock,
  TransactionDefinitionModel,
  TransactionMock,
  TransactionModel,
  TransactionStatusCountList,
  UpdateTransactionOptions,
  WorkflowMock,
  WorkflowModel,
} from '../models';
import { ProcessDocumentsMock, ProcessDocumentsModel } from './../models';
import { WorkApiRoutesService } from './work-api-routes.service';
/* eslint-disable @typescript-eslint/dot-notation */
describe('WorkApiService', () => {
  let service: WorkApiRoutesService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpTestingModule],
    });
    service = TestBed.inject(WorkApiRoutesService);
    httpTestingController = TestBed.inject(HttpTestingController);

    jest.spyOn<any, any>(service, '_handlePost$');
    jest.spyOn<any, any>(service, '_handleGet$');
    jest.spyOn<any, any>(service, '_handlePut$');
    jest.spyOn<any, any>(service, '_handleDelete$');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service['_baseUrl']).toEqual('https://dsgov-test.com/wm/api');
  });

  it('createUpdateSchemaDefinition$', done => {
    const mockSchemaDefinitionModel = new SchemaDefinitionModel(SchemaDefinitionMock);
    const key = 'mocktest';

    service.createUpdateSchemaDefinition$(key, mockSchemaDefinitionModel).subscribe(schemaDefinitionModel => {
      expect(schemaDefinitionModel).toEqual(mockSchemaDefinitionModel);
      expect(service['_handlePut$']).toHaveBeenCalledWith(`/v1/admin/schemas/${key}`, SchemaDefinitionMock);
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/admin/schemas/${key}`);
    expect(req.request.method).toEqual('PUT');
    req.flush(SchemaDefinitionMock);
  });

  it('getSchemaDefinitionByKey$', done => {
    const mockSchemaDefinitionModel = new SchemaDefinitionModel(SchemaDefinitionMock);
    const key = 'FinancialBenefit';

    service.getSchemaDefinitionByKey$(key).subscribe(schemaDefinitionModel => {
      expect(schemaDefinitionModel).toEqual(mockSchemaDefinitionModel);
      expect(service['_handleGet$']).toHaveBeenCalledWith(`/v1/admin/schemas/${key}`);
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/admin/schemas/${key}`);
    expect(req.request.method).toEqual('GET');
    req.flush(SchemaDefinitionMock);
  });

  it('getSchemaDefinitionList$', done => {
    const mockSchemaDefinitionModel = new SchemaDefinitionModel(SchemaDefinitionMock);

    service.getSchemaDefinitionList$().subscribe(schemaDefinitionModel => {
      expect(schemaDefinitionModel).toEqual(mockSchemaDefinitionModel);
      expect(service['_handleGet$']).toHaveBeenCalledWith(`/v1/admin/entity/schema`);
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/admin/entity/schema`);
    expect(req.request.method).toEqual('GET');
    req.flush(SchemaDefinitionMock);
  });

  it('createUpdateTransactionDefinition$', done => {
    const mockTransactionDefinitionModel = new TransactionDefinitionModel(TransactionDefinitionMock);

    service.createUpdateTransactionDefinition$('testKey', mockTransactionDefinitionModel).subscribe(transactionDefinitionModel => {
      expect(transactionDefinitionModel).toEqual(mockTransactionDefinitionModel);
      expect(service['_handlePut$']).toHaveBeenCalledWith(`/v1/admin/transactions/testKey`, TransactionDefinitionMock);
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/admin/transactions/testKey`);
    expect(req.request.method).toEqual('PUT');
    req.flush(TransactionDefinitionMock);
  });

  it('getTransactionDefinitionByKey$', done => {
    const mockTransactionDefinitionModel = new TransactionDefinitionModel(TransactionDefinitionMock);

    service.getTransactionDefinitionByKey$('testKey').subscribe(transactionDefinitionModel => {
      expect(transactionDefinitionModel).toEqual(mockTransactionDefinitionModel);
      expect(service['_handleGet$']).toHaveBeenCalledWith(`/v1/admin/transactions/testKey`);
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/admin/transactions/testKey`);
    expect(req.request.method).toEqual('GET');
    req.flush(TransactionDefinitionMock);
  });

  it('createTransaction$', done => {
    const mockTransactionModel = new TransactionModel(TransactionMock);

    service.createTransaction$('testKey').subscribe(transactionModel => {
      expect(transactionModel).toEqual(mockTransactionModel);
      expect(service['_handlePost$']).toHaveBeenCalledWith(`/v1/transactions`, { transactionDefinitionKey: 'testKey' });
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/transactions`);
    expect(req.request.method).toEqual('POST');
    req.flush(TransactionMock);
  });

  it('updateTransactionById$_Submit', done => {
    const mockTransactionModel = new TransactionModel(TransactionMock);
    const updateOptions: UpdateTransactionOptions = {
      completeTask: true,
      formStepKey: 'personalInformation',
      taskId: 'taskId',
      transaction: mockTransactionModel.toSchema(),
      transactionId: 'testId',
    };

    service.updateTransactionById$(updateOptions).subscribe(transactionModel => {
      expect(transactionModel).toEqual(mockTransactionModel);
      expect(service['_handlePut$']).toHaveBeenCalledWith(
        `/v1/transactions/testId`,
        {
          assignedTo: 'agent',
          data: mockTransactionModel.toSchema().data,
          priority: 'high',
        },
        {
          params: {
            completeTask: 'true',
            formStepKey: 'personalInformation',
            taskId: 'taskId',
          },
        },
      );
      done();
    });

    const req = httpTestingController.expectOne(
      `${service['_baseUrl']}/v1/transactions/testId?completeTask=true&formStepKey=personalInformation&taskId=taskId`,
    );
    expect(req.request.method).toEqual('PUT');
    req.flush(TransactionMock);
  });

  it('updateTransactionById$_UpdateData', done => {
    const mockTransactionModel = new TransactionModel(TransactionMock);
    const updateOptions: UpdateTransactionOptions = {
      completeTask: false,
      formStepKey: undefined,
      taskId: undefined,
      transaction: mockTransactionModel.toSchema(),
      transactionId: 'testId',
    };

    service.updateTransactionById$(updateOptions).subscribe(transactionModel => {
      expect(transactionModel).toEqual(mockTransactionModel);
      expect(service['_handlePut$']).toHaveBeenCalledWith(
        `/v1/transactions/testId`,
        {
          assignedTo: 'agent',
          data: mockTransactionModel.toSchema().data,
          priority: 'high',
        },
        {
          params: {
            completeTask: 'false',
          },
        },
      );
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/transactions/testId?completeTask=false`);
    expect(req.request.method).toEqual('PUT');
    req.flush(TransactionMock);
  });

  it('getTransactionById$', done => {
    const mockTransactionModel = new TransactionModel(TransactionMock);

    service.getTransactionById$('testId').subscribe(transactionModel => {
      expect(transactionModel).toEqual(mockTransactionModel);
      expect(service['_handleGet$']).toHaveBeenCalledWith(`/v1/transactions/testId`);
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/transactions/testId`);
    expect(req.request.method).toEqual('GET');
    req.flush(TransactionMock);
  });

  it('getTransactionsList$', done => {
    const mockTransactionModel = new TransactionModel(TransactionMock);
    const pagingRequestModel = new PagingRequestModel();
    service.getTransactionsList$(undefined, pagingRequestModel).subscribe(transactionModel => {
      expect(transactionModel.items).toEqual([mockTransactionModel]);
      expect(service['_handleGet$']).toHaveBeenCalledWith(`/v1/transactions?pageNumber=0&pageSize=50&sortOrder=ASC`, '');
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/transactions?pageNumber=0&pageSize=50&sortOrder=ASC`);
    expect(req.request.method).toEqual('GET');
    req.flush({ items: [TransactionMock], pagingMetadata: pagingRequestModel });
  });

  it('getTransactionDefinitionsList$', done => {
    const mockTransactionDefinitionModel = new TransactionDefinitionModel(TransactionDefinitionMock);
    const pagingRequestModel = new PagingRequestModel();
    service.getTransactionDefinitionsList$(undefined, pagingRequestModel).subscribe(transactionModel => {
      expect(transactionModel.items).toEqual([mockTransactionDefinitionModel]);
      expect(service['_handleGet$']).toHaveBeenCalledWith(`/v1/admin/transactions?pageNumber=0&pageSize=50&sortOrder=ASC`, '');
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/admin/transactions?pageNumber=0&pageSize=50&sortOrder=ASC`);
    expect(req.request.method).toEqual('GET');
    req.flush({ items: [TransactionDefinitionMock], pagingMetadata: pagingRequestModel });
  });

  it('getSchemasList$', done => {
    const mockSchemaDefinitionModel = new SchemaDefinitionModel(SchemaDefinitionMock);
    const pagingRequestModel = new PagingRequestModel();
    service.getSchemaDefinitionsList$(undefined, pagingRequestModel).subscribe(schemaModel => {
      expect(schemaModel.items).toEqual([mockSchemaDefinitionModel]);
      expect(service['_handleGet$']).toHaveBeenCalledWith(`/v1/admin/schemas?pageNumber=0&pageSize=50&sortOrder=ASC`, '');
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/admin/schemas?pageNumber=0&pageSize=50&sortOrder=ASC`);
    expect(req.request.method).toEqual('GET');
    req.flush({ items: [SchemaDefinitionMock], pagingMetadata: pagingRequestModel });
  });

  it('getWorkflowsList$', done => {
    const mockWorkflowModel = new WorkflowModel(WorkflowMock);
    const pagingRequestModel = new PagingRequestModel();
    service.getWorkflowsList$(pagingRequestModel).subscribe(workflowModel => {
      expect(workflowModel.items).toEqual([mockWorkflowModel]);
      expect(service['_handleGet$']).toHaveBeenCalledWith(`/v1/admin/workflows?pageNumber=0&pageSize=50&sortOrder=ASC`);
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/admin/workflows?pageNumber=0&pageSize=50&sortOrder=ASC`);
    expect(req.request.method).toEqual('GET');
    req.flush({ items: [WorkflowMock], pagingMetadata: pagingRequestModel });
  });

  it('getTransactionStatuses$', done => {
    const mockTransactionStatusCountList = TransactionStatusCountList;

    service.getTransactionStatuses$().subscribe(transactionStatusCountList => {
      expect(mockTransactionStatusCountList).toEqual(transactionStatusCountList);
      expect(service['_handleGet$']).toHaveBeenCalledWith(`/v1/transactions/statuses/count`);
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/transactions/statuses/count`);
    expect(req.request.method).toEqual('GET');
    req.flush(TransactionStatusCountList);
  });

  it('getAllTransactionsForUser$', done => {
    const mockTransactionModel = new TransactionModel(TransactionMock);

    service.getAllTransactionsForUser$().subscribe(transactionModels => {
      expect(transactionModels).toEqual({ items: [mockTransactionModel] });
      expect(service['_handleGet$']).toHaveBeenCalledWith(`/v1/my-transactions`);
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/my-transactions`);
    expect(req.request.method).toEqual('GET');
    req.flush({ items: [TransactionMock] });
  });

  describe('getFormByTransactionId$', () => {
    it('should get get form with taskName provided', done => {
      const mockFormModel = FormModelMock;

      service.getFormByTransactionId$('test', 'TestTask').subscribe(formModel => {
        expect(formModel).toEqual(mockFormModel);
        expect(service['_handleGet$']).toHaveBeenCalledWith(`/v1/transactions/test/active-forms`);
        done();
      });

      const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/transactions/test/active-forms`);
      expect(req.request.method).toEqual('GET');
      req.flush(ActiveFormsMock);
    });

    it('should get get form without taskName provided', done => {
      const mockFormModel = FormModelMock;

      service.getFormByTransactionId$('test').subscribe(formModel => {
        expect(formModel).toEqual(mockFormModel);
        expect(service['_handleGet$']).toHaveBeenCalledWith(`/v1/transactions/test/active-forms`);
        done();
      });

      const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/transactions/test/active-forms`);
      expect(req.request.method).toEqual('GET');
      req.flush(ActiveFormsMock);
    });
  });

  it('getFormConfigurations', done => {
    const mockFormConfigurationModel = new FormConfigurationModel(FormioConfigurationTestMock);

    service.getFormConfigurations$('transactionDefinitionKey').subscribe(formConfigurationModel => {
      expect(formConfigurationModel).toEqual(mockFormConfigurationModel.components);
      expect(service['_handleGet$']).toHaveBeenCalledWith(`/v1/admin/transactions/transactionDefinitionKey/forms`);
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/admin/transactions/transactionDefinitionKey/forms`);
    expect(req.request.method).toEqual('GET');
    req.flush(FormioConfigurationTestMock);
  });

  it('getFormConfigurationByKey', done => {
    const mockFormConfigurationModel = new FormConfigurationModel(FormioConfigurationTestMock);

    service.getFormConfigurationByKey$('transactionDefinitionKey', 'formKey').subscribe(formConfigurationModel => {
      expect(formConfigurationModel).toEqual(mockFormConfigurationModel.components);
      expect(service['_handleGet$']).toHaveBeenCalledWith(`/v1/admin/transactions/transactionDefinitionKey/forms/formKey`);
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/admin/transactions/transactionDefinitionKey/forms/formKey`);
    expect(req.request.method).toEqual('GET');
    req.flush(FormioConfigurationTestMock);
  });

  it('saveFormConfiguration', done => {
    const mockFormConfigurationModel = new FormConfigurationModel(FormioConfigurationTestMock);

    service.updateFormConfiguration$(FormMock, 'transactionDefinitionKey', 'formKey').subscribe(formConfigurationModel => {
      expect(formConfigurationModel).toEqual(mockFormConfigurationModel.components);
      expect(service['_handlePut$']).toHaveBeenCalledWith(`/v1/admin/transactions/transactionDefinitionKey/forms/formKey`, FormMock, {});
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/admin/transactions/transactionDefinitionKey/forms/formKey`);
    expect(req.request.method).toEqual('PUT');
    req.flush(FormioConfigurationTestMock);
  });

  it('processDocuments$', done => {
    const mockProcessDocumentsModel = new ProcessDocumentsModel(ProcessDocumentsMock);
    const mockProcessDocumentsResponse = {
      processors: ['processor1'],
    };

    service.processDocuments$('transactionId', mockProcessDocumentsModel).subscribe(processDocumentsResponse => {
      expect(processDocumentsResponse).toEqual(mockProcessDocumentsResponse);
      expect(service['_handlePost$']).toHaveBeenCalledWith(`/v1/transactions/transactionId/process-documents`, mockProcessDocumentsModel.toSchema());
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/transactions/transactionId/process-documents`);
    expect(req.request.method).toEqual('POST');
    req.flush(mockProcessDocumentsResponse);
  });

  it('getDashboard$', done => {
    service.getDashboard$('transactionSetKey').subscribe(dashboard => {
      expect(dashboard).toEqual(new DashboardModel(DashboardMock));
      expect(service['_handleGet$']).toHaveBeenCalledWith(`/v1/admin/dashboards/transactionSetKey`);
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/admin/dashboards/transactionSetKey`);
    expect(req.request.method).toEqual('GET');
    req.flush(DashboardMock);
  });

  it('getDashboards$', done => {
    service.getDashboards$().subscribe(dashboard => {
      expect(dashboard).toEqual([new DashboardModel(DashboardMock)]);
      expect(service['_handleGet$']).toHaveBeenCalledWith(`/v1/admin/dashboards`);
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/admin/dashboards`);
    expect(req.request.method).toEqual('GET');
    req.flush([DashboardMock]);
  });
});
