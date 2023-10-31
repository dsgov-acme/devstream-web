import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { DocumentModel } from '@dsg/shared/data-access/document-api';
import { ProcessDocumentsMock } from '@dsg/shared/data-access/work-api';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { LoggingService } from '@dsg/shared/utils/logging';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { render } from '@testing-library/angular';
import { axe } from 'jest-axe';
import { MockProvider, ngMocks } from 'ng-mocks';
import { of } from 'rxjs';
import { DocumentFormService, FormTransactionService } from '../../../../../services';
import { MockDefaultComponentProperties, MockDefaultFormlyModuleConfiguration, MockTemplate } from '../../../../../test';
import { FormlyFileUploaderComponent } from './file-uploader.component';

const mockModel = {};

const mockFields: FormlyFieldConfig[] = [
  {
    className: 'flex-half',
    key: 'documents.document1',
    props: {
      label: 'Document 1',
    },
    type: 'nuverialFileUploader',
  },
];

const documentModel = new DocumentModel({ ['document_id']: '1' });
const file = new File([], 'test.doc', { type: 'text/plain' });
const mockFormControl = new FormControl({ disabled: false, value: '123' });

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
        types: [{ component: FormlyFileUploaderComponent, name: 'nuverialFileUploader' }],
      }),
    ],
    providers: [
      MockProvider(LoggingService),
      MockProvider(NuverialSnackBarService),
      MockProvider(DocumentFormService, {
        openDocument$: jest.fn().mockImplementation(() => of(new Blob())),
        processDocument$: jest.fn().mockImplementation(() => of(ProcessDocumentsMock)),
        uploadDocument$: jest.fn().mockImplementation(() => of(documentModel)),
      }),
      MockProvider(FormTransactionService, {
        transactionId: 'testId',
      }),
    ],
  });
  const component = fixture.debugElement.query(By.directive(FormlyFileUploaderComponent)).componentInstance;

  return { component, fixture };
};

describe('FormlyFileUploaderComponent', () => {
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

  describe('Component Inputs', () => {
    it('should have default values', async () => {
      const { component } = await getFixtureByTemplate();

      expect(component.field).toBeDefined();
      expect(component.uploadProgress).toEqual(0);
      expect(component.field?.formControl?.value).toBeUndefined();
    });
  });

  describe('File upload', () => {
    it('should upload document', fakeAsync(async () => {
      const { component } = await getFixtureByTemplate();

      component.field = { formControl: mockFormControl, key: 'testGroupControl' };
      const service = ngMocks.findInstance(DocumentFormService);
      const uploadSpy = jest.spyOn(service, 'uploadDocument$');
      const processSpy = jest.spyOn(service, 'processDocument$');

      component.formControl.setValue(undefined);
      component.onUploadDocument(file);
      tick(1000);

      expect(uploadSpy).toBeCalledWith(file);
      expect(processSpy).toBeCalledWith('testId', '1', 'testGroupControl');
    }));

    it('should give progress response when document is uploaded', fakeAsync(async () => {
      const { component } = await getFixtureByTemplate();

      const service = ngMocks.findInstance(DocumentFormService);
      const spy = jest.spyOn(service, 'uploadDocument$').mockImplementation(() => of(80));

      component.onUploadDocument(file);
      tick(1000);

      expect(spy).toBeCalledWith(file);

      expect(component.field?.formControl?.value).toBeFalsy();
      expect(component.uploadProgress).toEqual(80);
    }));

    it('should emit on cancel upload', async () => {
      const { component } = await getFixtureByTemplate();

      const cancelSpy = jest.spyOn(component._cancelUpload$, 'next');

      component.onCancelUpload();

      expect(cancelSpy).toBeCalled();
    });

    it('should set file preview', async () => {
      const { component } = await getFixtureByTemplate();

      component.filePreview = file;

      expect(component._filePreview).toEqual(file);
      expect(component.filePreview).toEqual(file);
    });

    it('should set processing status', async () => {
      const { component } = await getFixtureByTemplate();
      const processingStatus = { failed: false, processors: [] };

      component.processingStatus = processingStatus;

      expect(component._processingStatus).toEqual(processingStatus);
      expect(component.processingStatus).toEqual(processingStatus);
    });

    it('should open the document', async () => {
      const { component } = await getFixtureByTemplate();
      const service = ngMocks.findInstance(DocumentFormService);
      const spy = jest.spyOn(service, 'openDocument$');

      component.formControl.setValue({ documentId: 'testId' });
      component.openDocument();

      expect(spy).toBeCalled();
    });
  });
});
