import { FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileUploadModule } from '@iplab/ngx-file-upload';
import { render } from '@testing-library/angular';
import { screen } from '@testing-library/dom';
import { axe } from 'jest-axe';
import { MockBuilder, MockService, ngMocks } from 'ng-mocks';
import { Subject } from 'rxjs';
import { NUVERIAL_FILE_UPLOAD_STATUS } from '../../models';
import { NuverialButtonComponent } from '../button';
import { NuverialIconComponent } from '../icon';
import { NuverialFileUploadComponent } from './file-upload.component';

const focusEvents = new Subject<FocusOrigin | null>();
const focusMonitor = MockService(FocusMonitor, {
  monitor: _ => focusEvents.asObservable(),
});

const dependencies = MockBuilder(NuverialFileUploadComponent)
  .keep(NuverialButtonComponent)
  .keep(NuverialIconComponent)
  .keep(MatTooltipModule)
  .keep(CommonModule)
  .keep(ReactiveFormsModule)
  .keep(FormsModule)
  .keep(FileUploadModule)
  .mock(FocusMonitor, focusMonitor)
  .build();

const fileData = 'new file doc';
const fileName = 'file.doc';
const fileType = 'application/msword';

const file = new File([fileData], fileName, { type: fileType });

const getFixture = async (props: Record<string, Record<string, unknown>>) => {
  const { fixture } = await render(NuverialFileUploadComponent, {
    ...dependencies,
    ...props,
  });

  return { fixture };
};

describe('NuverialFileUploadComponent', () => {
  describe('Accessibility', () => {
    it('should have no violations when ariaLabel is set', async () => {
      const componentProperties = { ariaLabel: 'file upload' };
      const { fixture } = await getFixture({ componentProperties });
      const axeResults = await axe(fixture.nativeElement);

      expect(axeResults).toHaveNoViolations();
      expect(ngMocks.find(fixture, 'file-upload').nativeElement.getAttribute('aria-label')).toEqual(componentProperties.ariaLabel);
    });
  });
  describe('Component Inputs', () => {
    it('should have default values', async () => {
      const { fixture } = await getFixture({});

      const photoButton = document.querySelector('[aria-label="TAKE PICTURE"]') as HTMLElement;
      const chooseFileButton = document.querySelector('[aria-label="CHOOSE FILE"]') as HTMLElement;

      expect(fixture.componentInstance.ariaLabel).toBeFalsy();
      expect(fixture.componentInstance.ariaDescribedBy).toBeFalsy();
      expect(fixture.componentInstance.formControl).toBeTruthy();
      expect(fixture.componentInstance.documentTitle).toEqual(undefined);
      expect(fixture.componentInstance.maxFileSize).toEqual(15);
      expect(fixture.componentInstance.fileDragDropAvailable).toEqual(true);
      expect(fixture.componentInstance.validationMessages).toBeFalsy();

      const fieldUpload = ngMocks.find(fixture, 'file-upload');
      expect(fieldUpload).toBeTruthy();
      expect(screen.getByText('Drag and drop your file, or')).toBeInTheDocument();
      expect(screen.getByText('browse')).toBeInTheDocument();
      expect(screen.getByText('The file must be 15MB or smaller in size.')).toBeInTheDocument();
      expect(photoButton).toBeTruthy();
      expect(chooseFileButton).toBeTruthy();
    });
  });

  describe('File upload', () => {
    it('should handle the selected file', async () => {
      const { fixture } = await getFixture({});
      fixture.detectChanges();

      const fileList: FileList = Object.assign([file], {
        item: (index: number) => (index === 0 ? file : null),
      });
      const event: Partial<Event> = {
        stopPropagation: jest.fn(),
        target: {
          files: fileList,
        } as HTMLInputElement,
      };

      const addFileSpy = jest.spyOn(fixture.componentInstance.fileUploadControl, 'addFile');
      const propagationSpy = jest.spyOn(event, 'stopPropagation');
      fixture.componentInstance.handleFileSelection(event as Event);

      expect(addFileSpy).toHaveBeenCalledWith(file);
      expect(propagationSpy).toHaveBeenCalled();
    });
    it('should set status message as success if success status is passed in', async () => {
      const { fixture } = await getFixture({});
      fixture.componentInstance.status = NUVERIAL_FILE_UPLOAD_STATUS.success;

      expect(fixture.componentInstance.statusMessage).toEqual('Successful Upload');
    });
    it('should set status message as pending if pending status is passed in', async () => {
      const { fixture } = await getFixture({});
      fixture.componentInstance.status = NUVERIAL_FILE_UPLOAD_STATUS.pending;

      expect(fixture.componentInstance.statusMessage).toEqual(undefined);
    });

    it('should set status message as processing if processing status is passed in', async () => {
      const { fixture } = await getFixture({});
      fixture.componentInstance.status = NUVERIAL_FILE_UPLOAD_STATUS.processing;

      expect(fixture.componentInstance.statusMessage).toEqual('Analyzing your upload to ensure it meets requirements');
    });
    it('should set status message as failure if failure status is passed in', async () => {
      const { fixture } = await getFixture({});
      fixture.componentInstance.status = NUVERIAL_FILE_UPLOAD_STATUS.failure;

      expect(fixture.componentInstance.statusMessage).toEqual('One or more possible issues detected');
    });
    it('should set status message as undefined if unknown status is passed in', async () => {
      const { fixture } = await getFixture({});
      fixture.componentInstance.status = 'unknown';

      expect(fixture.componentInstance.statusMessage).toEqual(undefined);
    });
    it('should not set image if empty file is passed in', async () => {
      const { fixture } = await getFixture({});
      const uploadFileSpy = jest.spyOn(fixture.componentInstance.uploadedFile, 'next');

      fixture.componentInstance['_setImagePreview'](file);
      expect(uploadFileSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.status).not.toEqual(NUVERIAL_FILE_UPLOAD_STATUS.success);
    });

    it('should show required error', async () => {
      const { fixture } = await getFixture({});
      fixture.componentInstance.ngOnInit();
      fixture.componentInstance.formControl = new FormControl();
      fixture.componentInstance.formControl.setValidators(Validators.required);

      fixture.componentInstance.formControl.markAsTouched();
      fixture.componentInstance.formControl.setValue(undefined);
      fixture.componentInstance.formControl.updateValueAndValidity();
      fixture.detectChanges();

      expect(screen.getByText('Required')).toBeInTheDocument();
    });
    it('should return undefined from validate required if formcontrol has required error and value', async () => {
      const { fixture } = await getFixture({});
      fixture.componentInstance.formControl = new FormControl();
      fixture.componentInstance.formControl.setValue('test');
      fixture.componentInstance.formControl.setErrors({ required: true });
      const requiredError = fixture.componentInstance.validateRequired();

      expect(requiredError).toEqual(undefined);
    });
    it('should show file size error', async () => {
      const { fixture } = await getFixture({});
      fixture.componentInstance.formControl = new FormControl();
      fixture.componentInstance.formControl.setErrors({ fileSize: true });
      const fileSizeError = fixture.componentInstance.validateFileSizeError();

      expect(fileSizeError).toEqual({ fileSize: true });
    });
    it('should do nothing if no file is selected', async () => {
      const { fixture } = await getFixture({});
      fixture.detectChanges();
      const event: Partial<Event> = {
        stopPropagation: jest.fn(),
        target: null,
      };
      const addFileSpy = jest.spyOn(fixture.componentInstance.fileUploadControl, 'addFile');
      const propagationSpy = jest.spyOn(event, 'stopPropagation');
      fixture.componentInstance.handleFileSelection(event as Event);

      expect(addFileSpy).not.toHaveBeenCalled();
      expect(propagationSpy).toHaveBeenCalled();
    });
    it('should upload file', async () => {
      const { fixture } = await getFixture({});
      const uploadedFileSpy = jest.spyOn(fixture.componentInstance.uploadedFile, 'next');
      const uploadDocumentSpy = jest.spyOn(fixture.componentInstance.uploadDocument, 'emit');

      fixture.componentInstance.uploadFile(file);
      fixture.detectChanges();
      expect(fixture.componentInstance.status).toEqual(NUVERIAL_FILE_UPLOAD_STATUS.pending);
      expect(fixture.componentInstance.status).toEqual(NUVERIAL_FILE_UPLOAD_STATUS.pending);
      expect(uploadedFileSpy).toHaveBeenCalledWith(file);
      expect(uploadDocumentSpy).toHaveBeenCalledWith(file);
    });
    it('should return true if file size error is set', async () => {
      const { fixture } = await getFixture({});
      jest.spyOn(fixture.componentInstance.fileUploadControl, 'getError').mockImplementation(() => [{ fileSize: true }, { required: true }]);
      let error = fixture.componentInstance.isFileSizeError();
      expect(error).toEqual(true);

      jest.spyOn(fixture.componentInstance.fileUploadControl, 'getError').mockImplementation(() => [{ required: true }]);
      error = fixture.componentInstance.isFileSizeError();
      expect(error).toEqual(false);
    });
    it('should handle file changes and set validation', async () => {
      const { fixture } = await getFixture({});
      const uploadFileSpy = jest.spyOn(fixture.componentInstance, 'uploadFile');
      const validatorSpy = jest.spyOn(fixture.componentInstance.fileUploadControl, 'setValidators');

      fixture.componentInstance.fileUploadControl.valueChanges.subscribe(() => {
        expect(uploadFileSpy).toHaveBeenCalledWith(file);
      });

      fixture.componentInstance.fileUploadControl.addFile(file);
      fixture.componentInstance.ngOnInit();
      fixture.detectChanges();

      expect(validatorSpy).toHaveBeenCalledWith(expect.arrayContaining([expect.any(Function)]));
    });
    it('should reupload image', async () => {
      const { fixture } = await getFixture({});
      fixture.componentInstance.uploadedFile.subscribe(() => {
        expect(uploadFileSpy).toHaveBeenCalled();
        expect(getImageSpy).toHaveBeenCalled();
        expect(removeFileSpy).toHaveBeenCalled();
        expect(fileBrowseSpy).toHaveBeenCalled();
      });
      const removeFileSpy = jest.spyOn(fixture.componentInstance.fileUploadControl, 'removeFile');
      const fileBrowseSpy = jest.spyOn(fixture.componentInstance, 'handleFileBrowserOpen');
      const uploadFileSpy = jest.spyOn(fixture.componentInstance, 'uploadFile');
      const getImageSpy = jest.spyOn(fixture.componentInstance as any, '_setImagePreview');

      fixture.componentInstance.fileUploadControl.addFile(file);
      fixture.componentInstance.ngOnInit();
      fixture.componentInstance.statusMessage = 'Successful Upload';
      fixture.componentInstance.uploadedFile.next(file);
      fixture.detectChanges();
    });
  });

  it('should take a photo when take photo button is clicked', async () => {
    const { fixture } = await getFixture({});
    const takePhotoSpy = jest.spyOn(fixture.componentInstance, 'captureMobilePhoto');

    const photoButton = document.querySelector('[aria-label="TAKE PICTURE"]') as HTMLElement;

    photoButton.click();
    expect(takePhotoSpy).toHaveBeenCalled();
  });
  it('should allow user to choose a file when choose file button is clicked', async () => {
    const { fixture } = await getFixture({});
    const fileBrowseSpy = jest.spyOn(fixture.componentInstance, 'handleFileBrowserOpen');

    const chooseFileButton = document.querySelector('[aria-label="CHOOSE FILE"]') as HTMLElement;

    chooseFileButton.click();
    expect(fileBrowseSpy).toHaveBeenCalled();
  });
  it('should analyze file during upload', async () => {
    const { fixture } = await getFixture({});

    fixture.componentInstance.fileUploadControl.addFile(file);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.status = 'processing';
    fixture.detectChanges();
    expect(screen.getByText('Analyzing your upload to ensure it meets requirements')).toBeInTheDocument();
  });

  it('should emit when user wants to stop file upload', async () => {
    const { fixture } = await getFixture({});
    fixture.componentInstance.fileUploadControl.addFile(file);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const cancelUploadSpy = jest.spyOn(fixture.componentInstance.cancelUpload, 'emit');
    const fileUploadControlSpy = jest.spyOn(fixture.componentInstance.fileUploadControl, 'removeFile');

    fixture.componentInstance.stopUpload();
    expect(cancelUploadSpy).toHaveBeenCalled();
    expect(fileUploadControlSpy).toHaveBeenCalledWith(file);
  });

  it('should set the maxFileSize when the value is defined', async () => {
    const { fixture } = await getFixture({});
    const component = fixture.componentInstance;

    component.maxFileSize = 20;

    expect(component['_maxFileSize']).toBe(20);
    expect(component.maxFileSize).toBe(20);
  });

  it('should set the maxFileSize when the value is undefined', async () => {
    const { fixture } = await getFixture({});
    const component = fixture.componentInstance;

    component.maxFileSize = undefined;

    expect(component['_maxFileSize']).toBe(15);
    expect(component.maxFileSize).toBe(15);
  });

  it('should set the file preview', async () => {
    const { fixture } = await getFixture({});
    const component = fixture.componentInstance;
    const addFileSpy = jest.spyOn(fixture.componentInstance.fileUploadControl, 'addFile');
    const uploadFileSpy = jest.spyOn(fixture.componentInstance, 'uploadFile');

    component.filePreview = new Blob();

    expect(addFileSpy).toHaveBeenCalled();
    expect(uploadFileSpy).not.toHaveBeenCalled();
  });

  it('should not set the file preview', async () => {
    const { fixture } = await getFixture({});
    const component = fixture.componentInstance;
    const addFileSpy = jest.spyOn(fixture.componentInstance.fileUploadControl, 'addFile');
    const uploadFileSpy = jest.spyOn(fixture.componentInstance, 'uploadFile');

    component.filePreview = undefined;

    expect(component['_skipUpload']).toBe(false);
    expect(addFileSpy).not.toHaveBeenCalled();
    expect(uploadFileSpy).not.toHaveBeenCalled();
  });

  it('should download the file', async () => {
    const { fixture } = await getFixture({});
    const createObjectURLMock = jest.fn().mockReturnValue('mocked-url');
    global.URL.createObjectURL = createObjectURLMock;
    const createElementMock = jest.spyOn(document, 'createElement').mockReturnValue({ click: jest.fn() } as unknown as HTMLAnchorElement);
    const appendChildMock = jest.spyOn(document.body, 'appendChild').mockImplementation();
    const removeChildMock = jest.spyOn(document.body, 'removeChild').mockImplementation();
    const revokeObjectURLMock = jest.fn();
    Object.defineProperty(window, 'URL', { value: { createObjectURL: jest.fn(), revokeObjectURL: revokeObjectURLMock } });
    fixture.componentInstance.downloadFile(file);

    expect(createElementMock).toHaveBeenCalledWith('a');
    expect(appendChildMock).toHaveBeenCalled();
    expect(removeChildMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });
});
