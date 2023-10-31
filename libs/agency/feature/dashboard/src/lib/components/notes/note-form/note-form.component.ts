import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { EnumMapType, NoteModel } from '@dsg/shared/data-access/work-api';
import { EnumerationsStateService } from '@dsg/shared/feature/app-state';
import {
  ConfirmationModalComponent,
  ConfirmationModalReponses,
  FormErrorsFromGroup,
  IFormError,
  INuverialBreadCrumb,
  INuverialSelectOption,
  MarkAllControlsAsTouched,
  NuverialBreadcrumbComponent,
  NuverialButtonComponent,
  NuverialFooterActionsComponent,
  NuverialFormErrorsComponent,
  NuverialIconComponent,
  NuverialSelectComponent,
  NuverialSnackBarService,
  NuverialSpinnerComponent,
  NuverialTextAreaComponent,
  NuverialTextInputComponent,
} from '@dsg/shared/ui/nuverial';
import { UntilDestroy } from '@ngneat/until-destroy';
import { EMPTY, Observable, catchError, map, of, switchMap, take, tap } from 'rxjs';
import { TransactionDetailService } from '../../transaction-detail/transaction-detail.service';

export enum NoteFormMode {
  Add,
  Edit,
}

enum Actions {
  save = 'save',
  cancel = 'cancel',
  delete = 'delete',
}

interface FooterAction {
  key: string;
  uiLabel: string;
  uiClass: 'Primary' | 'Secondary' | 'Adverse';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ConfirmationModalComponent,
    FormsModule,
    MatDialogModule,
    NuverialBreadcrumbComponent,
    NuverialButtonComponent,
    NuverialIconComponent,
    NuverialSelectComponent,
    NuverialSpinnerComponent,
    NuverialTextAreaComponent,
    NuverialTextInputComponent,
    ReactiveFormsModule,
    NuverialFormErrorsComponent,
    NuverialFooterActionsComponent,
  ],
  selector: 'dsg-note-form',
  standalone: true,
  styleUrls: ['./note-form.component.scss'],
  templateUrl: './note-form.component.html',
})
@UntilDestroy()
export class NoteFormComponent {
  public formErrors: IFormError[] = [];
  public transactionId = this._transactionDetailService.transactionId;

  private _noteId = '';
  public mode = NoteFormMode.Add;
  public loading = true;

  public actions: FooterAction[] = [
    {
      key: Actions.save,
      uiClass: 'Primary',
      uiLabel: 'Save',
    },
    {
      key: Actions.cancel,
      uiClass: 'Secondary',
      uiLabel: 'Cancel',
    },
  ];

  public formConfigs = {
    body: {
      id: 'note-form-body',
      label: 'Note',
    },
    title: {
      id: 'note-form-title',
      label: 'Title',
    },
    type: {
      id: 'note-form-type',
      label: 'Type',
    },
  };

  public breadCrumbs: INuverialBreadCrumb[] = [{ label: 'ALL NOTES', navigationPath: `/dashboard/transaction/${this.transactionId}/notes` }];
  public note$ = this._route.paramMap.pipe(
    switchMap(params => {
      this._noteId = params.get('noteId') ?? '';

      if (!this._noteId) return of(new NoteModel());

      this.mode = NoteFormMode.Edit;

      this.actions.push({
        key: Actions.delete,
        uiClass: 'Secondary',
        uiLabel: 'Delete',
      });

      return this._transactionDetailService.getNoteById$(this.transactionId, this._noteId).pipe(
        catchError(_error => {
          this._nuverialSnackBarService.notifyApplicationError();
          this.navigateToNotes();

          return EMPTY;
        }),
      );
    }),
    tap(note => {
      this.loading = false;
      this.noteFormGroup.patchValue({
        body: note.body,
        title: note.title,
        type: note.type.id,
      });
    }),
  );

  public noteTypesOptions$: Observable<INuverialSelectOption[]> = this._enumService.getEnumMap$(EnumMapType.NoteTypes).pipe(
    map(statuses => {
      const noteTypeSelectOptions: INuverialSelectOption[] = [];
      for (const [key, value] of statuses.entries()) {
        noteTypeSelectOptions.push({
          disabled: false,
          displayTextValue: value.label,
          key: key,
          selected: false,
        });
      }

      return noteTypeSelectOptions;
    }),
  );

  public formModeEnum = NoteFormMode;
  //Order disabled to match the order of the form in the form errors component
  /* eslint-disable sort-keys */
  public noteFormGroup = new FormGroup({
    title: new FormControl({ disabled: false, value: '' }, [Validators.required]),
    type: new FormControl({ disabled: false, value: '' }, [Validators.required]),
    body: new FormControl({ disabled: false, value: '' }, [Validators.min(10)]),
  });
  /* eslint-enable sort-keys */

  constructor(
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
    private readonly _transactionDetailService: TransactionDetailService,
    private readonly _dialog: MatDialog,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
    private readonly _enumService: EnumerationsStateService,
  ) {}

  public get headerTitle(): string {
    return this.mode === NoteFormMode.Add ? 'Add new note' : 'Edit note';
  }

  public navigateToNotes(): void {
    const transactionId = this.transactionId;

    if (transactionId) {
      this._router.navigate(['/dashboard', 'transaction', transactionId, 'notes']);
    }
  }

  public getNoteById(noteId: string) {
    return this._transactionDetailService.notes.find(n => n.id === noteId);
  }

  /* Ignored until we figure out how to mock matdialog properly to test this function */
  /* istanbul ignore next */
  public deleteNote() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = { nuverialConfirmationModalButtonLabel: 'Remove', nuverialConfirmationModalText: 'Are you sure you want to remove this note?' };
    dialogConfig.autoFocus = false;

    this._dialog
      .open(ConfirmationModalComponent, dialogConfig)
      .afterClosed()
      .pipe(
        take(1),
        switchMap(action => {
          if (action === ConfirmationModalReponses.Confirm) {
            return this._transactionDetailService.deleteNote$(this._transactionDetailService.transactionId, this._noteId).pipe(
              tap(_ => {
                this._nuverialSnackBarService.notifyApplicationSuccess();
                this.navigateToNotes();
              }),
            );
          }

          return EMPTY;
        }),
      )
      .subscribe();
  }

  public saveNote() {
    this.formErrors = [];

    if (!this.noteFormGroup.valid) {
      this.formErrors = FormErrorsFromGroup(this.noteFormGroup, this.formConfigs);
      MarkAllControlsAsTouched(this.noteFormGroup);

      return;
    }

    const formValue = this.noteFormGroup.value;
    const noteModel = new NoteModel();

    noteModel.body = formValue.body ?? '';
    noteModel.title = formValue.title ?? '';
    noteModel.type = { id: formValue.type ?? '' };

    if (this.mode === NoteFormMode.Edit) {
      // Edit existing note
      this._transactionDetailService
        .editNote$(this.transactionId, this._noteId, noteModel)
        .pipe(
          take(1),
          tap(_ => {
            this._nuverialSnackBarService.notifyApplicationSuccess();
            this.navigateToNotes();
          }),
          catchError(_ => {
            this._nuverialSnackBarService.notifyApplicationError();

            return EMPTY;
          }),
        )
        .subscribe();
    } else {
      // Add new note
      this._transactionDetailService
        .createNote$(this.transactionId, noteModel)
        .pipe(
          take(1),
          tap(_ => {
            this._nuverialSnackBarService.notifyApplicationSuccess();
            this.navigateToNotes();
          }),
          catchError(_ => {
            this._nuverialSnackBarService.notifyApplicationError();

            return EMPTY;
          }),
        )
        .subscribe();
    }
    this.formErrors = [];
  }

  public onActionClick(event: string) {
    switch (event) {
      case Actions.save:
        this.saveNote();
        break;
      case Actions.cancel:
        this.navigateToNotes();
        break;
      case Actions.delete:
        this.deleteNote();
        break;
    }
  }
}
