import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { AgencyUsersMock, UserModel } from '@dsg/shared/data-access/user-api';
import { FormListMock, FormMock, TransactionDefinitionModelMock, TransactionMetadataMock, WorkApiRoutesService } from '@dsg/shared/data-access/work-api';
import { UserStateService } from '@dsg/shared/feature/app-state';
import { FormBuilderService } from '@dsg/shared/feature/form-nuv';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { ENVIRONMENT_CONFIGURATION, mockEnvironment } from '@dsg/shared/utils/environment';
import { LoggingService } from '@dsg/shared/utils/logging';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { FormConfigurationsComponent } from './form-configurations.component';

describe('FormConfigurationsComponent', () => {
  let component: FormConfigurationsComponent;
  let fixture: ComponentFixture<FormConfigurationsComponent>;
  let mockWorkApiRoutesService: Partial<WorkApiRoutesService>;
  let _buildDataSourceTableSpy: jest.SpyInstance;

  const user = AgencyUsersMock.users.find(u => u.id === '111');
  const userMockModel = new UserModel(user);

  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(async () => {
    mockWorkApiRoutesService = {
      getFormConfigurations$: jest.fn().mockImplementation(() => of(FormMock)),
    };

    await TestBed.configureTestingModule({
      imports: [FormConfigurationsComponent, NoopAnimationsModule, HttpClientModule],
      providers: [
        MockProvider(LoggingService),
        MockProvider(UserStateService, {
          getUserById$: jest.fn().mockImplementation(() => of(userMockModel)),
        }),
        MockProvider(Router),
        MockProvider(FormBuilderService),
        MockProvider(NuverialSnackBarService),
        { provide: WorkApiRoutesService, useValue: mockWorkApiRoutesService },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: ENVIRONMENT_CONFIGURATION, useValue: mockEnvironment },
        { provide: MatSnackBar, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormConfigurationsComponent);
    component = fixture.componentInstance;
    _buildDataSourceTableSpy = jest.spyOn(component as any, '_buildDataSourceTable');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set formConfigurationListIsLoading to false after getting form configurations', () => {
    expect(component.formConfigurationListIsLoading).toBe(false);
  });

  it('should set formConfigurationList after getting form configurations', () => {
    expect(component.formConfigurationList).toEqual(FormMock);
  });

  it('should call the _buildDataSourceTable() on init', async () => {
    component.ngOnInit();
    fixture.detectChanges();
    expect(_buildDataSourceTableSpy).toBeCalled();
  });

  it('should build the table data', async () => {
    fixture.componentInstance.formConfigurationList = FormListMock;
    fixture.componentInstance['_buildDataSourceTable']();
    expect(fixture.componentInstance.dataSourceTable.data.length).toEqual(fixture.componentInstance.formConfigurationList.length);
  });

  it('should emit changeDefaultFormConfiguration event when setDefaultFormConfiguration is called', () => {
    const formConfigurationKey = 'testKey';
    const emitSpy = jest.spyOn(component.changeDefaultFormConfiguration, 'emit');
    component.setDefaultFormConfiguration(formConfigurationKey);
    expect(emitSpy).toHaveBeenCalledWith(formConfigurationKey);
  });

  it('should navigate to builder when navigateToBuilder method is called', () => {
    component.transactionDefinition = TransactionDefinitionModelMock;
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');
    component.navigateToBuilder('key');
    expect(navigateSpy).toHaveBeenCalledWith(['/admin', 'builder', TransactionDefinitionModelMock.key, 'key']);
  });

  it('should set formConfigurationListIsLoading to true after getting form configurations', () => {
    component.formConfigurationListIsLoading = true;
    component.ngOnInit();
    expect(component.formConfigurationListIsLoading).toBe(true);
  });

  describe('open', () => {
    it('dialog should open if metadata is defined', async () => {
      component.metaData = TransactionMetadataMock;
      jest
        .spyOn(component['_dialog'], 'open')
        .mockReturnValue({ afterClosed: () => of({ metaData: TransactionMetadataMock, save: true }) } as MatDialogRef<unknown, unknown>);
      component.open();
      expect(component.dialogRef).toBeDefined();
      expect(component.dialogRef?.afterClosed).toBeDefined();
    });

    it('should not update metadata if the dialog is closed without save', async () => {
      component.transactionDefinition = TransactionDefinitionModelMock;
      jest.spyOn(component['_dialog'], 'open').mockReturnValue({
        afterClosed: () => of({ metaData: TransactionMetadataMock, save: false }),
      } as MatDialogRef<unknown, unknown>);
      const updateMetaDataSpy = jest.spyOn(component['_formConfigurationService'], 'updateMetaData');
      component.open();
      await component.dialogRef?.afterClosed().toPromise();
      expect(updateMetaDataSpy).not.toHaveBeenCalled();
    });

    it('should handle error when update metadata fails', async () => {
      component.metaData = TransactionMetadataMock;
      jest.spyOn(component['_formConfigurationService'], 'updateMetaData').mockReturnValue(throwError(() => ({ status: 404 })));
      jest
        .spyOn(component['_dialog'], 'open')
        .mockReturnValue({ afterClosed: () => of({ metaData: TransactionMetadataMock, save: true }) } as MatDialogRef<unknown, unknown>);

      const notifyApplicationErrorSpy = jest.spyOn(component['_nuverialSnackBarService'], 'notifyApplicationError');

      component.open();
      await component.dialogRef?.afterClosed().toPromise();
      expect(component.loading).toBeFalsy();
      expect(notifyApplicationErrorSpy).toHaveBeenCalled();
    });
  });
});
