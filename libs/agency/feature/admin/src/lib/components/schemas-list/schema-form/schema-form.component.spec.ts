import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { HttpErrorResponse } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { ISchemaDefinition, SchemaDefinitionModel, WorkApiRoutesService } from '@dsg/shared/data-access/work-api';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { LoggingAdapter } from '@dsg/shared/utils/logging';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MockProvider } from 'ng-mocks';
import { Subject, of, throwError } from 'rxjs';
import { SchemaFormComponent } from './schema-form.component';

const mockLoggingService = {
  error: jest.fn(),
  log: jest.fn(),
};

const SchemaDefinitionMock: ISchemaDefinition = {
  attributes: [],
  createdBy: '',
  createdTimestamp: '',
  description: 'description',
  id: '',
  key: 'key',
  lastUpdatedTimestamp: '',
  name: 'name',
};

describe('SchemaFormComponent', () => {
  let component: SchemaFormComponent;
  let fixture: ComponentFixture<SchemaFormComponent>;
  let workApiRoutesService: WorkApiRoutesService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SchemaFormComponent],
      providers: [
        MockProvider(NuverialSnackBarService),
        MockProvider(WorkApiRoutesService, {
          createUpdateSchemaDefinition$: jest.fn().mockReturnValue(of(new SchemaDefinitionModel())),
          getSchemaDefinitionByKey$: jest.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 }))),
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: new Subject(),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: jest.fn(),
          },
        },
        {
          provide: LoggingAdapter,
          useValue: mockLoggingService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchemaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    workApiRoutesService = TestBed.inject(WorkApiRoutesService);
  });

  describe('Accessability', () => {
    it('should have no violations', async () => {
      const axeResults = await axe(fixture.nativeElement);
      expect.extend(toHaveNoViolations);
      expect(axeResults).toHaveNoViolations();
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getSchemaDefinitionByKey from service when saving the schema', () => {
    component.schemaFormGroup.setValue({
      description: 'description',
      key: 'key',
      name: 'name',
    });
    const spy = jest.spyOn(workApiRoutesService, 'getSchemaDefinitionByKey$');
    component.createSchema();

    expect(spy).toHaveBeenCalledWith('key');
  });

  it('should call createUpdateSchemaDefinition from service when saving the schema', fakeAsync(() => {
    component.schemaFormGroup.setValue({
      description: 'description',
      key: 'key',
      name: 'name',
    });
    jest.spyOn(workApiRoutesService, 'getSchemaDefinitionByKey$').mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    const spy = jest.spyOn(workApiRoutesService, 'createUpdateSchemaDefinition$');

    component.createSchema();
    tick();

    expect(spy).toHaveBeenCalledWith('key', SchemaDefinitionMock);
  }));

  it('should set formErrors as if schema key already exists', fakeAsync(() => {
    component.schemaFormGroup.setValue({
      description: 'Test body',
      key: 'key',
      name: 'Test Name',
    });
    jest.spyOn(workApiRoutesService, 'getSchemaDefinitionByKey$').mockReturnValue(of(new SchemaDefinitionModel()));
    jest.spyOn(workApiRoutesService, 'createUpdateSchemaDefinition$');

    component.createSchema();
    tick();

    expect(component.formErrors.length).toEqual(1);
    expect(component.formErrors[0].errorName).toEqual('keyExists');
  }));

  it('should call openSnackbar if createUpdateSchemaDefinition returns error', fakeAsync(() => {
    component.schemaFormGroup.setValue({
      description: 'Test body',
      key: 'another-test',
      name: 'Test Name',
    });
    jest.spyOn(workApiRoutesService, 'createUpdateSchemaDefinition$').mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    const nuverialSnackBarService = TestBed.inject(NuverialSnackBarService);
    const spyNotifyApplicationError = jest.spyOn(nuverialSnackBarService, 'notifyApplicationError');

    component.createSchema();
    tick();

    expect(spyNotifyApplicationError).toHaveBeenCalled();
  }));

  it('should set formErrors and showErrorHeader when form is invalid', () => {
    component.schemaFormGroup.setValue({
      description: 'Test body',
      key: '',
      name: 'Test type',
    });
    const spy = jest.spyOn(workApiRoutesService, 'createUpdateSchemaDefinition$');
    component.createSchema();

    expect(component.formErrors.length).toBeGreaterThan(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should call the createSchema method when the "save" action is clicked', () => {
    const spy = jest.spyOn(component, 'createSchema');

    component.onActionClick('save');

    expect(spy).toHaveBeenCalled();
  });

  it('should call the navigateToAdmin method when the "cancel" action is clicked', () => {
    const spy = jest.spyOn(component, 'navigateToSchemas');

    component.onActionClick('cancel');

    expect(spy).toHaveBeenCalled();
  });
});
