import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Filter, PagingRequestModel } from '@dsg/shared/data-access/http';
import {
  ISchemaDefinition,
  ISchemasPaginationResponse,
  ITransactionDefinitionsMetaData,
  TransactionDefinitionModel,
  WorkApiRoutesService,
} from '@dsg/shared/data-access/work-api';
import {
  FormErrorsFromGroup,
  IFormError,
  INuverialBreadCrumb,
  INuverialSelectOption,
  MarkAllControlsAsTouched,
  NuverialBreadcrumbComponent,
  NuverialFooterActionsComponent,
  NuverialFormErrorsComponent,
  NuverialFormMode,
  NuverialSelectComponent,
  NuverialSnackBarService,
  NuverialSpinnerComponent,
  NuverialTextAreaComponent,
  NuverialTextInputComponent,
} from '@dsg/shared/ui/nuverial';
import { EMPTY, Observable, catchError, combineLatest, map, of, switchMap, take, tap } from 'rxjs';
import { FormConfigurationsComponent } from '../form-configurations/form-configurations.component';
import { TransactionDefinitionsFormService } from './transaction-definitions-form.service';

enum Actions {
  create = 'create',
  edit = 'edit',
  cancel = 'cancel',
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
    NuverialBreadcrumbComponent,
    NuverialTextAreaComponent,
    NuverialTextInputComponent,
    ReactiveFormsModule,
    NuverialFooterActionsComponent,
    NuverialFormErrorsComponent,
    NuverialSelectComponent,
    NuverialSpinnerComponent,
    FormConfigurationsComponent,
  ],
  selector: 'dsg-transaction-definitions-form',
  standalone: true,
  styleUrls: ['./transaction-definitions-form.component.scss'],
  templateUrl: './transaction-definitions-form.component.html',
})
export class TransactionDefinitionsFormComponent {
  @Input() public metaData?: ITransactionDefinitionsMetaData;
  public formGroup: FormGroup;
  public formErrors: IFormError[] = [];
  private readonly pagingRequestModel: PagingRequestModel = new PagingRequestModel({ pageSize: 50 });
  private transactionDefinitionKey = '';
  public mode = NuverialFormMode.CREATE;
  public formModeEnum = NuverialFormMode;
  public validationMessages = { keyExists: 'Key already exists', maxlength: 'Invalid maximum length' };

  public breadcrumbs: INuverialBreadCrumb[] = [{ label: 'Back to Transaction Definitions', navigationPath: '/admin/transaction-definitions' }];
  public actions: FooterAction[] = [
    {
      key: Actions.create,
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
    category: {
      id: 'transaction-definition-form-category',
      label: 'Category',
    },
    description: {
      id: 'transaction-definition-form-description',
      label: 'Description',
    },
    key: {
      id: 'transaction-definition-form-key',
      label: 'Key',
    },
    name: {
      id: 'transaction-definition-form-name',
      label: 'Name',
    },
    processDefinitionKey: {
      id: 'transaction-definition-form-process-definition-key',
      label: 'Workflow',
    },
    schemaKey: {
      id: 'transaction-definition-form-schema-key',
      label: 'Schema',
    },
  };

  public transactionDefinition$: Observable<TransactionDefinitionModel> = this._route.paramMap.pipe(
    switchMap(params => {
      this.transactionDefinitionKey = params.get('transactionDefinitionKey') ?? '';

      if (!this.transactionDefinitionKey) return of(new TransactionDefinitionModel());

      this.mode = NuverialFormMode.UPDATE;
      this.formGroup.get('key')?.disable();

      this.actions = [
        {
          key: Actions.edit,
          uiClass: 'Primary',
          uiLabel: 'Save Changes',
        },
      ];

      return this._workApiRoutesService.getTransactionDefinitionByKey$(this.transactionDefinitionKey).pipe(
        catchError(_error => {
          this._nuverialSnackBarService.notifyApplicationError();
          this.navigateToTransactionDefinitions();

          return EMPTY;
        }),
      );
    }),
    tap(transactionDefinition => {
      this.formGroup.patchValue({
        category: transactionDefinition.category,
        defaultFormConfigurationKey: transactionDefinition.defaultFormConfigurationKey,
        description: transactionDefinition.description,
        key: transactionDefinition.key,
        name: transactionDefinition.name,
        processDefinitionKey: transactionDefinition.processDefinitionKey,
        schemaKey: transactionDefinition.schemaKey,
      });
    }),
  );

  public schemaOptions$: Observable<INuverialSelectOption[]> = this.transactionDefinition$.pipe(
    switchMap(value =>
      this.getSchemasList$([
        { field: 'key', value: value.schemaKey },
        { field: 'name', value: value.schemaKey },
      ]),
    ),
    switchMap(_ => this._transactionDefinitionsFormService.schemas$),
    map(x =>
      x.map(schemaDefinition => ({
        disabled: false,
        displayTextValue: schemaDefinition.name,
        key: schemaDefinition.key,
        selected: false,
      })),
    ),
    catchError(_ => {
      this._nuverialSnackBarService.notifyApplicationError();

      return EMPTY;
    }),
  );

  public workflowOptions$: Observable<INuverialSelectOption[]> = this._workApiRoutesService.getWorkflowsList$(this.pagingRequestModel).pipe(
    map(x =>
      x.items.map(workflow => ({
        disabled: false,
        displayTextValue: workflow.name,
        key: workflow.processDefinitionKey,
        selected: false,
      })),
    ),
    catchError(_ => {
      this._nuverialSnackBarService.notifyApplicationError();

      return EMPTY;
    }),
  );

  public formData$: Observable<{
    schemaOptions: INuverialSelectOption[];
    workflowOptions: INuverialSelectOption[];
    transactionDefinition: TransactionDefinitionModel;
  }> = combineLatest([this.schemaOptions$, this.workflowOptions$, this.transactionDefinition$]).pipe(
    map(([schemaOptions, workflowOptions, transactionDefinition]) => ({ schemaOptions, transactionDefinition, workflowOptions })),
  );

  public getSchemasList$(filters?: Filter[]): Observable<ISchemasPaginationResponse<ISchemaDefinition>> {
    return this._transactionDefinitionsFormService.loadSchemas$(filters, this.pagingRequestModel);
  }

  constructor(
    private readonly _router: Router,
    private readonly _workApiRoutesService: WorkApiRoutesService,
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
    private readonly _route: ActivatedRoute,
    private readonly _transactionDefinitionsFormService: TransactionDefinitionsFormService,
  ) {
    this.formGroup = new FormGroup({
      category: new FormControl(this.metaData?.category, [Validators.maxLength(200), Validators.required]),
      defaultFormConfigurationKey: new FormControl(this.metaData?.defaultFormConfigurationKey),
      description: new FormControl(this.metaData?.description, [Validators.maxLength(200)]),
      key: new FormControl(this.metaData?.key, [Validators.maxLength(200), Validators.required]),
      name: new FormControl(this.metaData?.name, [Validators.maxLength(200), Validators.required]),
      processDefinitionKey: new FormControl(this.metaData?.processDefinitionKey, [Validators.required]),
      schemaKey: new FormControl(this.metaData?.schemaKey, [Validators.required]),
    });
  }

  public createTransactionDefinition() {
    this._workApiRoutesService
      .getTransactionDefinitionByKey$(this.formGroup.value.key)
      .pipe(
        tap(transactionDefinition => {
          if (transactionDefinition || !this.formGroup.valid) {
            this.formGroup.controls['key'].setErrors({ keyExists: true });
            this.formErrors = FormErrorsFromGroup(this.formGroup, this.formConfigs);
            MarkAllControlsAsTouched(this.formGroup);

            return;
          }

          this.formErrors = [];
          this.saveTransactionDefinition();
        }),
        catchError(error => {
          if (error.status === 404) {
            if (!this.formGroup.valid) {
              this.formErrors = FormErrorsFromGroup(this.formGroup, this.formConfigs);
              MarkAllControlsAsTouched(this.formGroup);

              return EMPTY;
            }
            this.formErrors = [];
            this.saveTransactionDefinition();

            return EMPTY;
          }
          this._nuverialSnackBarService.notifyApplicationError();

          return EMPTY;
        }),
      )
      .subscribe();
  }

  public editTransactionDefinition() {
    this.formErrors = [];
    if (!this.formGroup.valid) {
      this.formErrors = FormErrorsFromGroup(this.formGroup, this.formConfigs);
      MarkAllControlsAsTouched(this.formGroup);

      return;
    }

    this.saveTransactionDefinition();
  }

  public saveTransactionDefinition() {
    const formValue = this.formGroup.value;
    const transactionDefinitionModel = new TransactionDefinitionModel();

    transactionDefinitionModel.category = formValue.category;
    transactionDefinitionModel.description = formValue.description || '';
    transactionDefinitionModel.key = this.mode === NuverialFormMode.CREATE ? formValue.key : this.transactionDefinitionKey;
    transactionDefinitionModel.name = formValue.name;
    transactionDefinitionModel.processDefinitionKey = formValue.processDefinitionKey;
    transactionDefinitionModel.schemaKey = formValue.schemaKey;
    transactionDefinitionModel.defaultStatus = 'draft';
    transactionDefinitionModel.defaultFormConfigurationKey = formValue.defaultFormConfigurationKey || '';

    this._workApiRoutesService
      .createUpdateTransactionDefinition$(transactionDefinitionModel.key, transactionDefinitionModel)
      .pipe(
        take(1),
        tap(_ => {
          this._nuverialSnackBarService.notifyApplicationSuccess();
          this._router.navigate(['/admin', 'transaction-definitions', transactionDefinitionModel.key]);
        }),
        catchError(_ => {
          this._nuverialSnackBarService.notifyApplicationError();

          return EMPTY;
        }),
      )
      .subscribe();
  }

  public handleSearchSchema(search: string) {
    if (search) {
      const filters = [
        { field: 'key', value: search },
        { field: 'name', value: search },
      ];

      this.getSchemasList$(filters).pipe(take(1)).subscribe();
    }
  }

  public handleClearSchema() {
    this.formGroup.patchValue({ schemaKey: '' });
  }

  public handleClearWorkflow() {
    this.formGroup.patchValue({ processDefinitionKey: '' });
  }

  public handleChangeDefaultFormConfiguration(defaultFormConfigurationKey: string) {
    this.formGroup.patchValue({ defaultFormConfigurationKey: defaultFormConfigurationKey });
  }

  public navigateToTransactionDefinitions() {
    this._router.navigate(['/admin', 'transaction-definitions']);
  }

  public onActionClick(event: string) {
    switch (event) {
      case Actions.create:
        this.createTransactionDefinition();
        break;
      case Actions.edit:
        this.editTransactionDefinition();
        break;
      case Actions.cancel:
        this.navigateToTransactionDefinitions();
        break;
    }
  }
}
