import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import {
  SchemaDefinitionListMock,
  SchemaDefinitionListSchemaMock,
  TransactionDefinitionMock,
  TransactionDefinitionMock2,
  TransactionDefinitionModel,
  TransactionDefinitionModelMock,
  WorkApiRoutesService,
  WorkflowListSchemaMock,
} from '@dsg/shared/data-access/work-api';
import { NuverialFormMode, NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { LoggingService } from '@dsg/shared/utils/logging';
import { MockProvider } from 'ng-mocks';
import { Subject, of, throwError } from 'rxjs';
import { TransactionDefinitionsFormComponent } from './transaction-definitions-form.component';
import { TransactionDefinitionsFormService } from './transaction-definitions-form.service';

describe('TransactionDefinitionsFormComponent', () => {
  let component: TransactionDefinitionsFormComponent;
  let fixture: ComponentFixture<TransactionDefinitionsFormComponent>;
  let activatedRouteSpy: { snapshot: any; paramMap: any };
  const transactionDefinitionKey = 'transactionDefinitionKey';

  beforeEach(async () => {
    activatedRouteSpy = {
      paramMap: new Subject(),
      snapshot: {
        queryParams: convertToParamMap({
          pageNumber: 3,
          pageSize: 10,
          sortBy: 'key',
          sortOrder: 'ASC',
        }),
      },
    };

    await TestBed.configureTestingModule({
      imports: [TransactionDefinitionsFormComponent, NoopAnimationsModule],
      providers: [
        MockProvider(LoggingService),
        MockProvider(Router),
        MockProvider(NuverialSnackBarService),
        {
          provide: ActivatedRoute,
          useValue: activatedRouteSpy,
        },
        MockProvider(WorkApiRoutesService, {
          createUpdateTransactionDefinition$: jest.fn().mockImplementation(() => of(TransactionDefinitionMock)),
          getSchemaDefinitionsList$: jest.fn().mockImplementation(() => of(SchemaDefinitionListSchemaMock)),
          getTransactionDefinitionByKey$: jest.fn().mockImplementation(() => of(null)),
          getWorkflowsList$: jest.fn().mockImplementation(() => of(WorkflowListSchemaMock)),
        }),
        MockProvider(TransactionDefinitionsFormService, {
          loadSchemas$: jest.fn().mockImplementation(() => of(SchemaDefinitionListSchemaMock)),
          schemas$: of(SchemaDefinitionListMock),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionDefinitionsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return schema types', () => {
    component.schemaOptions$.subscribe(schemaOptions => {
      expect(schemaOptions).toEqual(SchemaDefinitionListSchemaMock);
    });
  });

  it('should return workflow types', () => {
    component.workflowOptions$.subscribe(workflowOptions => {
      expect(workflowOptions).toEqual(WorkflowListSchemaMock);
    });
  });

  it('should call getSchemasList$ when handleSearchSchema is called with a non-empty string', () => {
    const search = 'test';
    const filters = [
      { field: 'key', value: search },
      { field: 'name', value: search },
    ];
    const getSchemasListSpy = jest.spyOn(component, 'getSchemasList$');

    component.handleSearchSchema(search);

    expect(getSchemasListSpy).toHaveBeenCalledWith(filters);
  });

  it('should not call getSchemasList$ when handleSearchSchema is called with an empty string', () => {
    const search = '';
    const getSchemasListSpy = jest.spyOn(component, 'getSchemasList$');

    component.handleSearchSchema(search);

    expect(getSchemasListSpy).not.toHaveBeenCalled();
  });

  it('should call patchValue with an empty string when handleClearSchema is called', () => {
    const patchValueSpy = jest.spyOn(component.formGroup, 'patchValue');

    component.handleClearSchema();

    expect(patchValueSpy).toHaveBeenCalledWith({ schemaKey: '' });
  });

  it('should call patchValue with an empty string when handleClearWorkflow is called', () => {
    const patchValueSpy = jest.spyOn(component.formGroup, 'patchValue');

    component.handleClearWorkflow();

    expect(patchValueSpy).toHaveBeenCalledWith({ processDefinitionKey: '' });
  });

  describe('Create TransactionDefinition', () => {
    beforeEach(() => {
      component.mode = NuverialFormMode.CREATE;

      const paramMapSubject = TestBed.inject(ActivatedRoute).paramMap as Subject<any>;
      paramMapSubject.next(convertToParamMap({ transactionDefinitionKey: '' }));
    });

    it('should call createUpdateTransactionDefinition from service when creating a transaction definition', () => {
      component.formGroup.patchValue({
        category: 'application',
        description: 'description',
        key: 'FinancialBenefit',
        name: 'Financial Benefit',
        processDefinitionKey: 'test_process',
        schemaKey: 'FinancialBenefit',
      });
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      const spy = jest.spyOn(workApiRoutesService, 'createUpdateTransactionDefinition$');
      component.createTransactionDefinition();

      expect(spy).toHaveBeenCalledWith(component.formGroup.value.key, TransactionDefinitionModelMock);
    });

    it('should still create a transaction definition if getTransactionDefinitionByKey$ throws a 404', () => {
      component.formGroup.patchValue({
        category: 'application',
        description: 'description',
        key: 'FinancialBenefit',
        name: 'Financial Benefit',
        processDefinitionKey: 'test_process',
        schemaKey: 'FinancialBenefit',
      });
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      const spy = jest.spyOn(workApiRoutesService, 'createUpdateTransactionDefinition$');
      const getTransactionDefinitionByKey$Spy = jest.spyOn(workApiRoutesService, 'getTransactionDefinitionByKey$').mockImplementation(() =>
        throwError(() => {
          return {
            status: 404,
          };
        }),
      );
      component.createTransactionDefinition();

      expect(getTransactionDefinitionByKey$Spy).toBeCalled();
      expect(spy).toHaveBeenCalledWith(component.formGroup.value.key, TransactionDefinitionModelMock);
    });

    it('should not create a transaction definition if getTransactionDefinitionByKey$ throws a 404 but has errors', () => {
      component.formGroup.patchValue({
        category: 'application',
        description: 'description',
        key: 'FinancialBenefit',
        name: '',
        processDefinitionKey: 'test_process',
        schemaKey: 'FinancialBenefit',
      });
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      const spy = jest.spyOn(workApiRoutesService, 'createUpdateTransactionDefinition$');
      const getTransactionDefinitionByKey$Spy = jest.spyOn(workApiRoutesService, 'getTransactionDefinitionByKey$').mockImplementation(() =>
        throwError(() => {
          return {
            status: 404,
          };
        }),
      );
      component.createTransactionDefinition();

      expect(getTransactionDefinitionByKey$Spy).toBeCalled();
      expect(component.formErrors.length).toBeGreaterThan(0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should call createUpdateTransactionDefinition even without description', () => {
      component.formGroup.patchValue({
        category: 'application',
        description: '',
        key: 'FinancialBenefit',
        name: 'Financial Benefit',
        processDefinitionKey: 'test_process',
        schemaKey: 'FinancialBenefit',
      });
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      const spy = jest.spyOn(workApiRoutesService, 'createUpdateTransactionDefinition$');
      component.createTransactionDefinition();

      const TransactionDefinitionMockNoDescription = { ...TransactionDefinitionMock2 };
      TransactionDefinitionMockNoDescription.description = '';
      expect(spy).toHaveBeenCalledWith(component.formGroup.value.key, new TransactionDefinitionModel(TransactionDefinitionMockNoDescription));
    });

    it('should call openSnackbar with error when creating a transaction definition', () => {
      component.formGroup.patchValue({
        category: 'Test category',
        description: 'Test description',
        key: 'Test key',
        name: 'Test name',
        processDefinitionKey: 'Test processDefinitionKey',
        schemaKey: 'Test schemaKey',
      });
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      jest.spyOn(workApiRoutesService, 'createUpdateTransactionDefinition$').mockReturnValue(throwError(() => new Error('')));

      const nuverialSnackBarService = TestBed.inject(NuverialSnackBarService);
      const spyNotifyApplicationError = jest.spyOn(nuverialSnackBarService, 'notifyApplicationError');

      component.createTransactionDefinition();

      expect(spyNotifyApplicationError).toHaveBeenCalled();
    });

    it('should set formErrors and showErrorHeader when form is invalid', () => {
      component.formGroup.patchValue({
        category: 'Test category',
        description: 'Test description',
        key: 'Test key',
        name: '',
        processDefinitionKey: 'Test processDefinitionKey',
        schemaKey: 'Test schemaKey',
      });
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      const spy = jest.spyOn(workApiRoutesService, 'createUpdateTransactionDefinition$');
      component.createTransactionDefinition();

      expect(component.formErrors.length).toBeGreaterThan(0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should set formErrors and showErrorHeader when creating a transaction definition with key that already exists', () => {
      component.formGroup.patchValue({
        category: 'Test category',
        description: 'Test description',
        key: 'Test key',
        name: 'Test name',
        processDefinitionKey: 'Test processDefinitionKey',
        schemaKey: 'Test schemaKey',
      });
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      const createUpdateTransactionDefinition$Spy = jest.spyOn(workApiRoutesService, 'createUpdateTransactionDefinition$');
      const getTransactionDefinitionByKey$Spy = jest
        .spyOn(workApiRoutesService, 'getTransactionDefinitionByKey$')
        .mockImplementation(() => of(new TransactionDefinitionModel(TransactionDefinitionMock)));
      component.createTransactionDefinition();

      expect(component.formErrors.length).toBeGreaterThan(0);
      expect(getTransactionDefinitionByKey$Spy).toBeCalled();
      expect(createUpdateTransactionDefinition$Spy).not.toHaveBeenCalled();
    });

    it('should call the create method when using "create" action', () => {
      const spy = jest.spyOn(component, 'createTransactionDefinition');

      component.onActionClick('create');

      expect(spy).toHaveBeenCalled();
    });

    it('should call the navigate method when the "cancel" action is clicked', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = jest.spyOn(router, 'navigate');
      const spy = jest.spyOn(component, 'navigateToTransactionDefinitions');

      component.onActionClick('cancel');

      expect(spy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/admin', 'transaction-definitions']);
    });
  });

  describe('Edit TransactionDefinition', () => {
    beforeEach(() => {
      component.mode = NuverialFormMode.UPDATE;

      const paramMapSubject = TestBed.inject(ActivatedRoute).paramMap as Subject<any>;
      paramMapSubject.next(convertToParamMap({ transactionDefinitionKey }));
    });

    it('should call the edit method when using "edit" action', () => {
      const spy = jest.spyOn(component, 'editTransactionDefinition');

      component.onActionClick('edit');

      expect(spy).toHaveBeenCalled();
    });

    it('should call createUpdateTransactionDefinition from service when editing a transaction definition', () => {
      component.formGroup.patchValue({
        category: 'application',
        description: 'description',
        key: transactionDefinitionKey,
        name: 'Financial Benefit',
        processDefinitionKey: 'test_process',
        schemaKey: 'FinancialBenefit',
      });
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      const spy = jest.spyOn(workApiRoutesService, 'createUpdateTransactionDefinition$');
      component.editTransactionDefinition();

      const transactionDefinitionMock = { ...TransactionDefinitionMock2 };
      transactionDefinitionMock.key = transactionDefinitionKey;
      expect(spy).toHaveBeenCalledWith(transactionDefinitionKey, new TransactionDefinitionModel(transactionDefinitionMock));
    });

    it('should call getTransactionDefinitionByKey when transactionDefinitionKey is present in URL', () => {
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      const spy = jest.spyOn(workApiRoutesService, 'getTransactionDefinitionByKey$');

      expect(spy).toHaveBeenCalledWith(transactionDefinitionKey);
    });

    it('should call error and return to transaction definitions page when getTransactionDefinitionByKey errors', () => {
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      const spy = jest.spyOn(workApiRoutesService, 'getTransactionDefinitionByKey$').mockReturnValue(throwError(() => new Error('')));
      const nuverialSnackBarService = TestBed.inject(NuverialSnackBarService);
      const spyNotifyApplicationError = jest.spyOn(nuverialSnackBarService, 'notifyApplicationError');

      component.transactionDefinition$.subscribe(_ => {
        expect(spyNotifyApplicationError).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(transactionDefinitionKey);
      });
    });

    it('should call patchValue with the correct defaultFormConfigurationKey', () => {
      const defaultFormConfigurationKey = 'test';
      component.formGroup.patchValue({
        category: 'application',
        defaultFormConfigurationKey: defaultFormConfigurationKey,
        description: 'description',
        key: transactionDefinitionKey,
        name: 'Financial Benefit',
        processDefinitionKey: 'test_process',
        schemaKey: 'FinancialBenefit',
      });
      const patchValueSpy = jest.spyOn(component.formGroup, 'patchValue');

      component.handleChangeDefaultFormConfiguration(defaultFormConfigurationKey);
      expect(patchValueSpy).toHaveBeenCalledWith({ defaultFormConfigurationKey: defaultFormConfigurationKey });
    });
  });

  it('should call getSchemasList$ with both name and key if transactionDefinition is present when schemaOptions is fetched', () => {
    const filters = [
      { field: 'key', value: TransactionDefinitionModelMock.key },
      { field: 'name', value: TransactionDefinitionModelMock.key },
    ];

    const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
    const getTransactionDefinitionByKeySpy = jest
      .spyOn(workApiRoutesService, 'getTransactionDefinitionByKey$')
      .mockReturnValue(of(TransactionDefinitionModelMock));
    const getSchemasListSpy = jest.spyOn(component, 'getSchemasList$');

    const paramMapSubject = TestBed.inject(ActivatedRoute).paramMap as Subject<any>;
    paramMapSubject.next(convertToParamMap({ transactionDefinitionKey: TransactionDefinitionModelMock.key }));

    expect(getSchemasListSpy).toHaveBeenCalledWith(filters);
    expect(getTransactionDefinitionByKeySpy).toHaveBeenCalledWith(TransactionDefinitionModelMock.key);
  });

  it('should call getSchemasList$ with empty params if transactionDefinition is not present when schemaOptions is fetched', () => {
    const filters = [
      { field: 'key', value: '' },
      { field: 'name', value: '' },
    ];

    const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
    const getTransactionDefinitionByKeySpy = jest.spyOn(workApiRoutesService, 'getTransactionDefinitionByKey$');
    const getSchemasListSpy = jest.spyOn(component, 'getSchemasList$');

    const paramMapSubject = TestBed.inject(ActivatedRoute).paramMap as Subject<any>;
    paramMapSubject.next(convertToParamMap({ transactionDefinitionKey: '' }));

    expect(getSchemasListSpy).toHaveBeenCalledWith(filters);
    expect(getTransactionDefinitionByKeySpy).not.toHaveBeenCalled();
  });
});
