import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { LoggingService } from '@dsg/shared/utils/logging';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { render, screen } from '@testing-library/angular';
import { axe } from 'jest-axe';
import { MockProvider } from 'ng-mocks';
import { DocumentFormService } from '../../../../services';
import { MockDefaultComponentProperties, MockDefaultFormlyModuleConfiguration, MockTemplate } from '../../../../test';
import { FormTransactionService } from './../../../../services/form-transaction.service';
import { FormlyFileUploaderComponent } from './file-uploader/file-uploader.component';
import { FormlyFileUploadComponent } from './formly-file-upload.component';

const mockModel = {};

const mockFields: FormlyFieldConfig[] = [
  {
    fieldGroup: [
      {
        key: 'documents.document1',
        props: {
          label: 'Document 1',
        },
      },
    ],
    key: 'documents',
    props: {
      label: 'File Upload Label',
    },
    type: 'nuverialFileUpload',
  },
];

const getFixtureByTemplate = async (props?: Record<string, unknown>) => {
  const template = MockTemplate;
  const { fixture } = await render(template, {
    componentProperties: {
      ...MockDefaultComponentProperties,
      fields: mockFields,
      model: mockModel,
      ...props,
    },
    imports: [
      ReactiveFormsModule,
      FormlyModule.forRoot({
        ...MockDefaultFormlyModuleConfiguration,
        types: [
          { component: FormlyFileUploadComponent, name: 'nuverialFileUpload' },
          { component: FormlyFileUploaderComponent, name: 'nuverialFileUploader' },
        ],
      }),
    ],
    providers: [
      MockProvider(LoggingService),
      MockProvider(NuverialSnackBarService),
      MockProvider(DocumentFormService, {}),
      MockProvider(FormTransactionService, {}),
    ],
  });
  const component = fixture.debugElement.query(By.directive(FormlyFileUploadComponent)).componentInstance;

  return { component, fixture };
};

describe('FormlyFileUploadComponent', () => {
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting(),
      { teardown: { destroyAfterEach: false } }, // required in formly tests
    );
  });

  it('should create', async () => {
    const { fixture } = await getFixtureByTemplate();

    expect(fixture).toBeTruthy();
  });

  describe('Accessibility', () => {
    it('should have no violations', async () => {
      const { fixture } = await getFixtureByTemplate();
      const axeResults = await axe(fixture.nativeElement);

      expect(axeResults).toHaveNoViolations();
    });
  });

  it('should verify the dom', async () => {
    await getFixtureByTemplate();

    expect(screen.getByText('File Upload Label')).toBeInTheDocument();
    expect(screen.getByText('SHOW LESS')).toBeInTheDocument();
    expect(screen.getByText('Document 1')).toBeInTheDocument();
  });

  it('should verify fromControls', async () => {
    const { component } = await getFixtureByTemplate();

    expect(component.formControls.length).toEqual(1);
  });
});
