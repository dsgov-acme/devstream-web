import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { SchemaDefinitionModel, WorkApiRoutesService } from '@dsg/shared/data-access/work-api';
import {
  FormErrorsFromGroup,
  IFormError,
  INuverialBreadCrumb,
  MarkAllControlsAsTouched,
  NuverialBreadcrumbComponent,
  NuverialButtonComponent,
  NuverialFooterActionsComponent,
  NuverialFormErrorsComponent,
  NuverialIconComponent,
  NuverialSnackBarService,
  NuverialSpinnerComponent,
  NuverialTextAreaComponent,
  NuverialTextInputComponent,
  SplitCamelCasePipe,
} from '@dsg/shared/ui/nuverial';
import { EMPTY, catchError, finalize, take, tap } from 'rxjs';

enum Actions {
  save = 'save',
  cancel = 'cancel',
}

interface FooterAction {
  key: string;
  uiLabel: string;
  uiClass: 'Primary' | 'Secondary';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NuverialTextInputComponent,
    MatPaginatorModule,
    NuverialSpinnerComponent,
    SplitCamelCasePipe,
    MatTableModule,
    MatSortModule,
    NuverialBreadcrumbComponent,
    NuverialButtonComponent,
    NuverialFooterActionsComponent,
    NuverialIconComponent,
    NuverialTextAreaComponent,
    NuverialFormErrorsComponent,
    ReactiveFormsModule,
  ],
  selector: 'dsg-schema-form',
  standalone: true,
  styleUrls: ['./schema-form.component.scss'],
  templateUrl: './schema-form.component.html',
})
export class SchemaFormComponent {
  public formErrors: IFormError[] = [];
  public loading = false;

  public breadCrumbs: INuverialBreadCrumb[] = [
    {
      label: 'Back to Schemas',
      navigationPath: '/admin/schemas',
    },
  ];

  public actions: FooterAction[] = [
    {
      key: Actions.save,
      uiClass: 'Primary',
      uiLabel: 'Create Schema',
    },
    {
      key: Actions.cancel,
      uiClass: 'Secondary',
      uiLabel: 'Cancel',
    },
  ];

  public formConfigs = {
    description: {
      id: 'schema-form-description',
      label: 'Description',
    },
    key: {
      id: 'schema-form-key',
      label: 'Key',
    },
    name: {
      id: 'schema-form-name',
      label: 'Name',
    },
  };

  public validationMessages = { keyExists: 'Key already exists', maxlength: 'Invalid maximum length', required: 'Field is required' };

  constructor(
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
    private readonly _router: Router,
    private readonly _workApiRoutesService: WorkApiRoutesService,
    private readonly _changeDetectorRef: ChangeDetectorRef,
  ) {}

  public schemaFormGroup = new FormGroup({
    description: new FormControl({ disabled: false, value: '' }, [Validators.maxLength(200)]),
    key: new FormControl({ disabled: false, value: '' }, [Validators.maxLength(200), Validators.required]),
    name: new FormControl({ disabled: false, value: '' }, [Validators.maxLength(200), Validators.required]),
  });

  public navigateToSchemas(): void {
    this._router.navigate(['/admin/schemas']);
  }

  public saveSchema(schemaModel: SchemaDefinitionModel) {
    return this._workApiRoutesService.createUpdateSchemaDefinition$(schemaModel.key, schemaModel).pipe(
      take(1),
      tap(_ => {
        this._nuverialSnackBarService.notifyApplicationSuccess();
        this.navigateToSchemas();
      }),
      catchError(_ => {
        this._nuverialSnackBarService.notifyApplicationError();

        return EMPTY;
      }),
    );
  }

  public createSchema() {
    this.formErrors = [];
    if (!this.schemaFormGroup.valid) {
      this.formErrors = FormErrorsFromGroup(this.schemaFormGroup, this.formConfigs);
      MarkAllControlsAsTouched(this.schemaFormGroup);

      return;
    }

    const formValue = this.schemaFormGroup.value;
    const schemaModel = new SchemaDefinitionModel();

    schemaModel.description = formValue.description ?? '';
    schemaModel.key = formValue.key ?? '';
    schemaModel.name = formValue.name ?? '';

    this.loading = true;
    this._workApiRoutesService
      .getSchemaDefinitionByKey$(schemaModel.key)
      .pipe(
        take(1),
        tap(schemaDefinition => {
          if (schemaDefinition || !this.schemaFormGroup.valid) {
            this.schemaFormGroup.controls.key.setErrors({ keyExists: true });
            this.formErrors = FormErrorsFromGroup(this.schemaFormGroup, this.formConfigs);
            MarkAllControlsAsTouched(this.schemaFormGroup);

            return;
          }

          this.formErrors = [];

          this.saveSchema(schemaModel);
        }),
        catchError(_error => {
          if (_error.status === 404) {
            this.formErrors = [];

            return this.saveSchema(schemaModel);
          }
          this._nuverialSnackBarService.notifyApplicationError();

          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this._changeDetectorRef.detectChanges();
        }),
      )
      .subscribe();
  }

  public onActionClick(event: string) {
    switch (event) {
      case Actions.save:
        this.createSchema();
        break;
      case Actions.cancel:
        this.navigateToSchemas();
        break;
    }
  }
}
