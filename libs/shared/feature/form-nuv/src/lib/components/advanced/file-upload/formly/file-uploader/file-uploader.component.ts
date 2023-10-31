import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DocumentModel, checkIfDocumentShouldDisplayErrors } from '@dsg/shared/data-access/document-api';
import { IProcessingStatus, NuverialFileUploadComponent, NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EMPTY, Subject, catchError, filter, map, switchMap, take, takeUntil, tap } from 'rxjs';
import { FormlyBaseComponent } from '../../../../base';
import { FormStateMode } from '../../../../forms';
import { FileUploadFieldProperties } from '../../models/formly-file-upload.model';
import { DocumentFormService } from './../../../../../services/document-form.service';
import { FormTransactionService } from './../../../../../services/form-transaction.service';

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialFileUploadComponent],
  selector: 'dsg-file-uploader',
  standalone: true,
  styleUrls: ['./file-uploader.component.scss'],
  templateUrl: './file-uploader.component.html',
})
export class FormlyFileUploaderComponent extends FormlyBaseComponent<FileUploadFieldProperties> implements OnInit {
  private _uploadProgress = 0;
  private _filePreview?: Blob;
  private _processingStatus?: IProcessingStatus;
  public loading = false;

  constructor(
    private readonly _changeDetectorRef: ChangeDetectorRef,
    private readonly _documentFormService: DocumentFormService,
    private readonly _formTransactionService: FormTransactionService,
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
  ) {
    super();
  }

  public get uploadProgress(): number {
    return this._uploadProgress;
  }

  public set uploadProgress(uploadProgress: number) {
    this._uploadProgress = uploadProgress;
    this._changeDetectorRef.markForCheck();
  }

  public get filePreview(): Blob | undefined {
    return this._filePreview;
  }

  public set filePreview(filePreview: Blob | undefined) {
    this._filePreview = filePreview;
    this._changeDetectorRef.markForCheck();
  }

  public get processingStatus(): IProcessingStatus | undefined {
    return this._processingStatus;
  }

  public set processingStatus(processingStatus: IProcessingStatus | undefined) {
    this._processingStatus = processingStatus;
    this._changeDetectorRef.markForCheck();
  }

  private readonly _cancelUpload$ = new Subject<void>();

  private _initFilePreview(): void {
    const documentId = this.formControl.value?.documentId;

    if (this.mode !== FormStateMode.Edit || !documentId) return;

    this.loading = true;
    this._documentFormService
      .getDocumentFileDataById$(documentId)
      .pipe(
        tap(file => {
          this.filePreview = file;
          this.loading = false;
        }),
        switchMap(() => this._documentFormService.getProcessingResultsById$(documentId)),
        tap(processingResult => {
          this.processingStatus = {
            failed: checkIfDocumentShouldDisplayErrors(processingResult) > 0,
            processors: processingResult,
          };
        }),
        catchError(_error => {
          this._nuverialSnackBarService.notifyApplicationError();

          return EMPTY;
        }),
        // We handle unsubscribe in 3 ways here because this is a polling observable and we want to complete if this cancels or we navigate away
        take(1),
        takeUntil(this._cancelUpload$),
        untilDestroyed(this),
      )
      .subscribe();
  }

  public ngOnInit(): void {
    this._initFilePreview();
  }

  public onUploadDocument(file: File) {
    this.uploadProgress = 0;
    this._documentFormService
      .uploadDocument$(file)
      .pipe(
        tap(response => {
          if (typeof response === 'number') {
            this.uploadProgress = response;
          }

          if (response instanceof DocumentModel) {
            this.formControl?.setValue({
              ...this.formControl.value,
              documentId: response.documentId,
              filename: file.name,
            });
            this._changeDetectorRef.markForCheck();
          }
        }),
        filter(response => response instanceof DocumentModel),
        map(response => response as DocumentModel),
        switchMap(document =>
          this._documentFormService.processDocument$(this._formTransactionService.transactionId, document.documentId, this.field.key?.toString() || ''),
        ),
        tap(processingResult => {
          this.processingStatus = {
            failed: checkIfDocumentShouldDisplayErrors(processingResult) > 0,
            processors: processingResult,
          };
        }),
        catchError(_error => {
          this._nuverialSnackBarService.notifyApplicationError();
          this.formControl.setValue(undefined);
          this._changeDetectorRef.markForCheck();

          return EMPTY;
        }),
        // We handle unsubscribe in 3 ways here because this is a polling observable and we want to complete if this cancels or we navigate away
        take(1),
        takeUntil(this._cancelUpload$),
        untilDestroyed(this),
      )
      .subscribe();
  }

  public onCancelUpload() {
    this._cancelUpload$.next();
  }

  public openDocument() {
    this._documentFormService.openDocument$(this.formControl.value.documentId).pipe(take(1)).subscribe();
  }
}
