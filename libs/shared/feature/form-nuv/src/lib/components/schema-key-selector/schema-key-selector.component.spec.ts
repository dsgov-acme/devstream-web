import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { SchemaTreeDefinitionMock, WorkApiRoutesService } from '@dsg/shared/data-access/work-api';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { MockProvider, ngMocks } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { SchemaKeySelectorComponent } from './schema-key-selector.component';

describe('SchemaKeySelectorComponent', () => {
  let component: SchemaKeySelectorComponent;
  let fixture: ComponentFixture<SchemaKeySelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchemaKeySelectorComponent, NoopAnimationsModule],
      providers: [
        MockProvider(NuverialSnackBarService),
        MockProvider(MatDialog, {
          open: jest.fn().mockReturnValue({
            afterClosed: () => of(''),
          }),
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ transactionDefinitionKey: 'FinancialBenefit' })),
          },
        },
        MockProvider(WorkApiRoutesService, {
          getSchemaTree$: jest.fn().mockImplementation(() => of(SchemaTreeDefinitionMock)),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchemaKeySelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('selectedSchemaKey', () => {
    it('should be empty on init', () => {
      expect(component.selectedSchemaKey).toBeFalsy();
    });
  });

  describe('clearSelectedSchemaKey', () => {
    it('should be set selectedSchemaKey to falsy value when called', () => {
      component.selectedSchemaKey = 'some key';
      expect(component.selectedSchemaKey).toBe('some key');

      component.clearSelectedSchemaKey();
      expect(component.selectedSchemaKey).toBeFalsy();
    });

    it('should call updateValue with new falsy key', () => {
      const spy = jest.spyOn(component, 'updateValue');

      component.selectedSchemaKey = 'some key';
      expect(component.selectedSchemaKey).toBe('some key');

      component.clearSelectedSchemaKey();
      expect(component.selectedSchemaKey).toBeFalsy();
      expect(spy).toHaveBeenCalledWith(component.selectedSchemaKey);
    });
  });

  describe('openModal', () => {
    it('dialog should open and set the returned key', async () => {
      expect(component.selectedSchemaKey).toBeFalsy();

      const spy = jest.spyOn(component['_dialog'], 'open').mockReturnValue({ afterClosed: () => of('FinancialBenefit') } as MatDialogRef<unknown, unknown>);
      component.openModal();

      expect(spy).toHaveBeenCalled();
      expect(component.selectedSchemaKey).toBe('FinancialBenefit');
    });
  });

  describe('loadSchemaTree$', () => {
    it('should call getSchemaTree$ with the transactionDefinitionKey from the route', () => {
      const service = ngMocks.findInstance(WorkApiRoutesService);
      const spy = jest.spyOn(service, 'getSchemaTree$');

      component.loadSchemaTree$.subscribe();

      expect(spy).toHaveBeenCalledWith('FinancialBenefit');
    });

    it('should set the existing schema key if value is a key in the tree', () => {
      const spy = jest.spyOn(component, 'checkAndSetExistingSchemaKey');
      component.value = 'CommonPersonalInformation.address';

      component.loadSchemaTree$.subscribe();

      expect(spy).toHaveBeenCalledWith('CommonPersonalInformation.address', expect.anything());
      expect(component.selectedSchemaKey).toBe('CommonPersonalInformation.address');
    });

    it('should set the existing schema key if value is a key in the tree', () => {
      const spy = jest.spyOn(component, 'checkAndSetExistingSchemaKey');
      component.value = 'some fake key';

      component.loadSchemaTree$.subscribe();

      expect(spy).toHaveBeenCalledWith('some fake key', expect.anything());
      expect(component.selectedSchemaKey).toBeFalsy();
    });

    it('should catch errors and notify application error', () => {
      const service = ngMocks.findInstance(WorkApiRoutesService);
      const snackbarService = ngMocks.findInstance(NuverialSnackBarService);
      const spy = jest.spyOn(service, 'getSchemaTree$').mockImplementation(() => throwError(() => new Error('error')));
      const notifyApplicationErrorSpy = jest.spyOn(snackbarService, 'notifyApplicationError');

      component.loadSchemaTree$.subscribe();

      expect(spy).toHaveBeenCalled();
      expect(notifyApplicationErrorSpy).toHaveBeenCalled();
    });
  });
});
