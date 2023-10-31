import { FocusMonitor } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Injector,
  Input,
  OnChanges,
  OnInit,
  Optional,
  Output,
  Self,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FileUploadControl, FileUploadModule, FileUploadValidators, ValidationErrors } from '@iplab/ngx-file-upload';
import { BehaviorSubject, combineLatest, filter, map, Observable, startWith, tap } from 'rxjs';
import { FormInputBaseDirective } from '../../common';
import { NUVERIAL_FILE_UPLOAD_STATUS } from '../../models';
import { NuverialButtonComponent } from '../button';
import { IProcessingStatus, ITooltipProcessingResult, NuverialFileProcessorTooltipComponent } from '../file-processor-tooltip';
import { NuverialFormFieldErrorComponent } from '../form-field-error';
import { NuverialIconComponent } from '../icon';

/***
 * File upload component that uploads the file. This is an example of how it can be used
 * in the parent component to handle the progress and retrieve the document id
 *
 * ## Usage
 *
 * ```
 * <nuverial-file-upload
  [uploadProgress]="uploadProgressFront"
  documentTitle="License Front"
  (uploadDocument)="onUploadDocumentFront($event)"
  (cancelUpload)="onCancelFrontUpload()"
></nuverial-file-upload>
 *
 * *** Example of upload document service call in parent component
 *
 * public onUploadDocumentFront(file: File) {
 * this.uploadProgressFront = 0;
 * this._documentService
 *   .uploadDocument$(file)
 *   .pipe(
 *     tap(response => {
 *       if (typeof response === 'number') {
 *         this.uploadProgressFront = response;
 *         this._changeDetectorRef.detectChanges();
 *       }
 *     }),
 *     takeUntil(this._cancelUploadFront$),
 *   )
 *   .subscribe();
 * }
 * ```
 */

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NuverialButtonComponent,
    NuverialFormFieldErrorComponent,
    FileUploadModule,
    NuverialIconComponent,
    MatFormFieldModule,
    NuverialFileProcessorTooltipComponent,
    MatProgressSpinnerModule,
  ],
  selector: 'nuverial-file-upload',
  standalone: true,
  styleUrls: ['./file-upload.component.scss'],
  templateUrl: './file-upload.component.html',
})
export class NuverialFileUploadComponent extends FormInputBaseDirective implements ControlValueAccessor, OnInit, OnChanges {
  /**
   * Skip uploading if the file is a preview due to already being uploaded
   * Upload if a new file is selected
   */
  private _skipUpload = false;

  private _status = NUVERIAL_FILE_UPLOAD_STATUS.initial;

  private _file!: File;

  private _maxFileSize = 15;

  // We override formControl here because file upload requires the formControl to be created
  /**
   * The formControl
   */
  @Input() public override formControl: FormControl = new FormControl();

  /**
   * Attached to the aria-label attribute of the host element. This should be considered a required input field, if not provided a warning message will be logged
   */
  @Input() public ariaLabel?: string;

  /**
   * TextInput aria described by
   */
  @Input() public ariaDescribedBy?: string;

  /**
   * The title of the document to be uploaded
   */
  @Input() public documentTitle?: string;

  /**
   * Determines if the drag and drop functionality is available
   */
  @Input() public fileDragDropAvailable = true;

  /**
   * The status of the fileupload component
   */
  @Input()
  public set status(status: string) {
    this._status = status;
    switch (status) {
      case NUVERIAL_FILE_UPLOAD_STATUS.success:
        this.statusMessage = 'Successful Upload';
        break;

      case NUVERIAL_FILE_UPLOAD_STATUS.pending:
        this.statusMessage = undefined;
        break;

      case NUVERIAL_FILE_UPLOAD_STATUS.processing:
        this.statusMessage = 'Analyzing your upload to ensure it meets requirements';
        break;

      case NUVERIAL_FILE_UPLOAD_STATUS.initial:
        this.statusMessage = undefined;
        break;

      case NUVERIAL_FILE_UPLOAD_STATUS.failure:
        this.statusMessage = 'One or more possible issues detected';
        break;

      default:
        this.statusMessage = undefined;
    }

    this._changeDetectorRef.markForCheck();
  }

  public get status(): string {
    return this._status;
  }

  /**
   * The progress of the uploaded file
   */
  @Input()
  public uploadProgress = 0;

  /**
   * The maximum file size of the uploaded document in MB
   */
  @Input()
  public get maxFileSize(): number {
    return this._maxFileSize;
  }

  public set maxFileSize(value: number | undefined) {
    if (!value) return;

    this._maxFileSize = value;
  }

  @Input()
  public set filePreview(blob: Blob | undefined) {
    if (!blob) return;

    this._skipUpload = true;
    this.fileUploadControl?.addFile(blob as File);
    this._setImagePreview(blob as File, NUVERIAL_FILE_UPLOAD_STATUS.processing);
    this._skipUpload = false;
  }

  @Input()
  public set processingStatus(processingStatus: IProcessingStatus | undefined) {
    if (typeof processingStatus?.failed !== 'boolean') return;

    this.processors = processingStatus.processors;
    this.status = processingStatus.failed ? NUVERIAL_FILE_UPLOAD_STATUS.failure : NUVERIAL_FILE_UPLOAD_STATUS.success;
  }

  /**
   * multiple true is not yet implemented
   */
  @Input()
  public multiple = false;

  @Input()
  public loading = false;

  @Output()
  public readonly cancelUpload = new EventEmitter<void>();

  @Output()
  public readonly uploadDocument = new EventEmitter<File>();

  @ViewChild('fileInput', { static: false }) public fileInput!: ElementRef<HTMLInputElement>;

  public fileUploadControl = new FileUploadControl();
  public statusMessage?: string;
  public progressWidth = '0%';
  public imageError = false;
  public statusOptions = NUVERIAL_FILE_UPLOAD_STATUS;
  public processors?: ITooltipProcessingResult[];

  public get maxFileSizeBytes() {
    return this.maxFileSize * 1024 * 1024;
  }

  public readonly uploadedFile: BehaviorSubject<unknown> = new BehaviorSubject<unknown>('');

  constructor(
    protected _changeDetectorRef: ChangeDetectorRef,
    protected _elementRef: ElementRef,
    protected readonly _focusMonitor: FocusMonitor,
    @Inject(Injector) protected override readonly _injector: Injector,
    @Self() @Optional() protected override readonly _ngControl: NgControl,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.formControl = this._modelFormControl();

    this.setMaxFileSizeValidator();

    this.fileUploadControl.valueChanges
      .pipe(
        filter(_ => !this._skipUpload),
        tap((files: File[]) => {
          if (files.length > 0) {
            this._file = files[0];
            if (this.isFileSizeError()) {
              this.setFormControlFileSizeError();
            } else {
              this.imageError = false;
              this.formControl?.setErrors(null);
              this.uploadFile(this._file);
            }
          } else {
            this.status = NUVERIAL_FILE_UPLOAD_STATUS.initial;
          }
        }),
      )
      .subscribe();

    this._initErrorHandler(this._focusMonitor.monitor(this._elementRef, true).pipe(filter(origin => origin === null)));
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['uploadProgress']) {
      const progress = changes['uploadProgress'];
      this.progressWidth = `${progress.currentValue}%`;
      if (progress.currentValue >= 100) {
        this._setImagePreview(this._file);
      }
    }
  }

  public setMaxFileSizeValidator() {
    this.fileUploadControl.setValidators([FileUploadValidators.fileSize(this.maxFileSizeBytes)]);
  }

  public setFormControlFileSizeError() {
    this.formControl.setErrors({ fileSize: true });
  }

  public uploadFile(file: File): void {
    this.imageError = false;
    this.status = NUVERIAL_FILE_UPLOAD_STATUS.pending;
    this.uploadedFile.next(file);
    this.uploadDocument.emit(file);
  }

  public handleFileSelection(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    event.stopPropagation();
    if (!fileInput || !fileInput.files) {
      return;
    }
    this.fileUploadControl?.addFile(fileInput.files[0]);
  }

  public stopUpload(): void {
    this.cancelUpload.emit();
    this.formControl.setValue(undefined);
    this.fileInput.nativeElement.value = '';

    if (this.fileUploadControl.size > 0 && this._file) {
      this.fileUploadControl.removeFile(this._file);
    }
  }

  public downloadFile(file: File): void {
    const fileUrl = URL.createObjectURL(file);

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = file.name;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(fileUrl);
  }

  private _setImagePreview(file: File, status = NUVERIAL_FILE_UPLOAD_STATUS.processing): void {
    if (!FileReader || file.size === 0) return;

    const fr = new FileReader();
    fr.onload = (e: ProgressEvent<FileReader>) => {
      this.uploadedFile.next(e.target?.result);
      this.status = status;
      this.uploadProgress = 0;
      this._changeDetectorRef.markForCheck();
    };

    fr.readAsDataURL(file);
  }

  public handleFileBrowserOpen(event: Event): void {
    this.stopUpload();
    event.stopPropagation();
    this.fileInput.nativeElement.click();
  }

  /**
   * This code is WIP and will be addressed in the future
   */
  // istanbul ignore next
  public captureMobilePhoto(event: Event): void {
    // open mobile camera and capture photo
    const fileInput = event.target as HTMLInputElement;
    if (fileInput && fileInput.files) {
      this.fileUploadControl.addFile(fileInput.files[0]);
    }
  }

  public isFileSizeError(): boolean {
    const errors = this.fileUploadControl.getError();

    return errors.length > 0 && errors.some((error: ValidationErrors) => Object.prototype.hasOwnProperty.call(error, 'fileSize'));
  }

  public removeFile(file: File): void {
    this.fileUploadControl.removeFile(file);
    this.stopUpload();
  }

  protected override _initErrorHandler(events: Observable<unknown>): void {
    this.error$ = combineLatest([
      events.pipe(startWith(null)),
      this.formControl?.statusChanges.pipe(
        filter(status => !!status),
        startWith(null),
      ),
      this.formControl?.valueChanges.pipe(
        filter(value => !!value),
        startWith(null),
      ),
    ]).pipe(
      filter(([event, _status]) => event === null),
      map(([_event, _status]) => {
        const fileSizeError = this.validateFileSizeError();
        const errors = fileSizeError || this.validateRequired();
        if (fileSizeError) {
          this.stopUpload();
        }

        return (
          errors &&
          Object.keys(errors).map(key => ({
            [key]: this._validationMessage(key, this.validationMessages),
          }))
        );
      }),
      tap(errors => errors && this.validationErrors.emit(errors)),
      map(errors => (errors ? Object.keys(errors[0]).map(key => errors[0][key])[0] : '')),
    );
  }

  public validateFileSizeError(): ValidationErrors | undefined {
    if (this.formControl?.hasError('fileSize')) {
      return { fileSize: true };
    }

    return undefined;
  }

  public validateRequired(): ValidationErrors | undefined {
    if (!this.formControl?.hasError('required')) {
      return undefined;
    } else if (this.formControl.touched && !this.formControl.value) {
      return { required: true };
    }

    return undefined;
  }
}
