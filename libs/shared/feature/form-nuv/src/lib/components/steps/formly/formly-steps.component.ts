import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { CONFIRMATION_STEP_KEY, TransactionModel } from '@dsg/shared/data-access/work-api';
import {
  GetAllFormErrors,
  IFormError,
  INuverialPanel,
  IStep,
  MarkAllControlsAsTouched,
  NuverialAccordionComponent,
  NuverialButtonComponent,
  NuverialFooterActionsComponent,
  NuverialFormErrorsComponent,
  NuverialIconComponent,
  NuverialSnackBarService,
  NuverialStepperComponent,
  NuverialStepperKeyDirective,
  StepperFadeInOut,
} from '@dsg/shared/ui/nuverial';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { catchError, EMPTY, Observable, tap } from 'rxjs';
import { FormTransactionService } from '../../../services/form-transaction.service';
import { FormlyBaseComponent } from '../../base';
import { FormStateMode, FormStateStepperMode, FormStateWorkflow } from '../../forms';
import { FormlyStepFieldProperties } from './formly-step.model';

enum Actions {
  next = 'next',
  previous = 'previous',
}

interface FooterAction {
  key: string;
  uiLabel: string;
  uiClass: 'Primary' | 'Secondary' | 'Adverse';
  buttonProps?: {
    style?: string;
    color?: string;
  };
}

interface FormFooterActions {
  previous: FooterAction;
  next: FooterAction;
}

@UntilDestroy()
@Component({
  animations: [StepperFadeInOut],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormlyModule,
    NuverialStepperComponent,
    NuverialButtonComponent,
    NuverialIconComponent,
    NuverialAccordionComponent,
    MatStepperModule,
    NuverialStepperKeyDirective,
    NuverialFormErrorsComponent,
    NuverialFooterActionsComponent,
  ],
  selector: 'dsg-formly-steps',
  standalone: true,
  styleUrls: ['./formly-steps.component.scss'],
  templateUrl: './formly-steps.component.html',
})
export class FormlyStepsComponent extends FormlyBaseComponent implements OnInit {
  @ViewChild(NuverialStepperComponent) public nuvStepper!: NuverialStepperComponent;
  private _initialFormStateMode = '';

  private _panelList: INuverialPanel[] = [];

  // Intake form limited to only one activeTask, can have multiple actions at the end of the form
  private activeTaskActions: FooterAction[] = [];

  // Hardcoded base actions for intake form: "Back" and "Save & Continue"
  private readonly baseFooterActions: FormFooterActions = {
    next: {
      buttonProps: { color: 'primary', style: 'filled' },
      key: Actions.next,
      uiClass: 'Primary',
      uiLabel: 'Save & Continue',
    },
    previous: {
      buttonProps: { color: 'primary', style: 'outlined' },
      key: Actions.previous,
      uiClass: 'Secondary',
      uiLabel: 'Back',
    },
  };

  public returnToReviewStep = false;
  public confirmationStepKey = CONFIRMATION_STEP_KEY;
  public steps: IStep[] = [];
  public formStateStepperMode = FormStateStepperMode;
  public formStateWorkflowMode = FormStateWorkflow;

  public isConfirmationStep = false;
  public updatingTransaction = false;
  public formErrors$: Observable<IFormError[]> = this._formTransactionService.formErrors$;
  public modelSnapshot = '';

  public actions: FooterAction[] = [];
  public loadFooterActions$ = this._formTransactionService.transaction$.pipe(
    // We currently assume that there can be a maximum of one active task
    tap(transaction => {
      if (transaction.activeTasks.length && transaction.activeTasks[0].actions.length) {
        // Only one action so far
        this.activeTaskActions = transaction.activeTasks[0].actions;
      }
    }),
    untilDestroyed(this),
  );

  private _retrieveActions(selectedStep: number): FooterAction[] {
    const actions = [];
    const fieldGroupLength = this.field?.fieldGroup?.length || 0;

    // Rightmost button
    if (selectedStep === fieldGroupLength - 1) {
      actions.push(...this.activeTaskActions);
    }
    // Middle button
    if (selectedStep < fieldGroupLength - 1) {
      actions.push(this.baseFooterActions.next);
    }
    // Leftmost button
    if (selectedStep !== 0 || this.returnToReviewStep) {
      actions.push(this.baseFooterActions.previous);
    }

    return actions;
  }

  /**
   * Event handler for when the the footer action buttons are clicked
   */
  public onActionClick(event: string) {
    switch (event) {
      case Actions.next:
        this.onSave('next');
        break;
      case Actions.previous:
        this.onSave('previous');
        break;
      default:
        this.onSave('complete');
        break;
    }
  }

  /**
   * The panel list used on the confirmation/review step of the intake form
   */
  public get confirmationPanelList(): INuverialPanel[] {
    if (!this._panelList.length) {
      this._panelList =
        this.field.fieldGroup
          ?.filter((step: FormlyFieldConfig<FormlyStepFieldProperties>) => step.props?.stepKey !== CONFIRMATION_STEP_KEY)
          .map(step => ({
            expanded: true,
            id: step.props?.['stepKey'],
            panelTitle: step.props?.label,
          })) || [];
    }

    return this._panelList;
  }

  /**
   * The panel list used on the confirmation/review step of the intake form
   */
  public get reviewModePanelList(): INuverialPanel[] {
    if (!this._panelList.length) {
      this._panelList =
        this.field.fieldGroup?.map(step => ({
          expanded: true,
          id: step.props?.['stepKey'],
          panelTitle: step.props?.label,
        })) || [];
    }

    return this._panelList;
  }

  public get stepperMode(): FormStateStepperMode {
    return this.formState.stepperMode;
  }

  public get formWorkflow(): FormStateWorkflow {
    return this.formState.workflow;
  }

  private _goToFirstInvalidStep(): void {
    const stepField: FormlyFieldConfig<FormlyStepFieldProperties> = this.field.fieldGroup?.[this.nuvStepper.stepper.selectedIndex] || {};
    const stepKey = stepField.props?.stepKey || '';

    if (stepKey != CONFIRMATION_STEP_KEY) {
      const stepForm = this._getAllControlsFromStep(stepField);

      if (!stepForm?.valid) {
        this._handleFormErrors(stepField, stepForm);
        MarkAllControlsAsTouched(stepForm);

        return;
      }
      this.nuvStepper.stepper.next();
      this._goToFirstInvalidStep();
    }
  }

  private _retrieveSteps(): IStep[] {
    const steps: IStep[] = [];
    this.field.fieldGroup?.forEach(step => {
      const stepKey = step.props?.['stepKey'];
      const form = stepKey === CONFIRMATION_STEP_KEY ? undefined : this._getAllControlsFromStep(step);

      steps.push({
        form,
        label: step.props?.label || '',
        stepKey,
      });
    });

    return steps;
  }

  private _handleFormErrors(stepField: FormlyFieldConfig<FormlyStepFieldProperties>, stepForm: AbstractControl | null): void {
    if (!stepForm) return;

    const formErrors = Object.entries(GetAllFormErrors(stepForm) || [])
      .map(([key, errorName]) => {
        const controlName = `${key}`;
        const field = stepField.get?.(controlName);
        const id = `${controlName}-field`;

        if (!field) return;

        return {
          controlName,
          errorName,
          id,
          label: this._getComponentLabel(String(field?.key) || ''),
        };
      })
      .filter((error): error is IFormError => error !== undefined);

    this._formTransactionService.setFormErrors(formErrors);
  }

  private _getComponentLabel(key: string): string {
    const formElement = this._formTransactionService.formConfiguration.getComponentLabelAndComponentByKey(key);
    let label = formElement.label;
    const component = formElement.component;

    if (component?.props?.formErrorLabel) {
      label = component?.props?.formErrorLabel;
    }

    return label;
  }

  private _saveTransaction(completeTask?: boolean, formStepKey?: string): Observable<TransactionModel | void> {
    this._formTransactionService.resetFormErrors();

    this.updatingTransaction = true;

    return this._formTransactionService.updateTransaction$(completeTask, formStepKey).pipe(
      tap(_ => {
        this.updatingTransaction = false;
        this.options.updateInitialValue?.();

        this.steps[this.nuvStepper.stepper.selectedIndex].state = 'SAVED';
        if (this.steps[this.nuvStepper.stepper.selectedIndex + 1]?.state === 'LOCKED') {
          this.steps[this.nuvStepper.stepper.selectedIndex + 1].state = 'UNLOCKED';
        }

        this.modelSnapshot = JSON.stringify(_.data);
      }),
      catchError(_error => {
        this.updatingTransaction = false;

        if (_error?.error?.formioValidationErrors) {
          const stepField: FormlyFieldConfig<FormlyStepFieldProperties> = this.field.fieldGroup?.[this.nuvStepper.stepper.selectedIndex] || {};
          const mappedErrors: IFormError[] = _error.error.formioValidationErrors.map(({ controlName, errorName }: IFormError) => {
            const field = stepField.get?.(controlName);
            const control = this.form.get?.(controlName);
            control?.setErrors({ [errorName]: true });

            return {
              controlName: controlName,
              errorName: errorName,
              id: `${controlName}-field`,
              label: this._formTransactionService.formConfiguration.getComponentLabelByKey((field?.key || '').toString()),
            };
          });

          this._formTransactionService.setFormErrors(mappedErrors);
          MarkAllControlsAsTouched(this.form);

          return EMPTY;
        }

        this._nuverialSnackBarService.notifyApplicationError();

        return EMPTY;
      }),
    );
  }

  private _getAllControlsFromStep(stepField: FormlyFieldConfig<FormlyStepFieldProperties>): FormGroup {
    const formGroup = new FormGroup({});

    const getControlsRecursively = (field: FormlyFieldConfig<FormlyStepFieldProperties>): void => {
      if (field.hide) return;

      for (const nestedField of field?.fieldGroup || []) {
        if (nestedField.hide) continue;

        const key = nestedField.key?.toString() || '';
        const control = this.form.get(key);

        if (control instanceof FormControl) {
          formGroup.addControl(key, control);
        }

        if (nestedField.fieldGroup?.length) {
          getControlsRecursively(nestedField);
        }
      }
    };

    getControlsRecursively(stepField);

    return formGroup;
  }

  constructor(
    private readonly _router: Router,
    private readonly _formTransactionService: FormTransactionService,
    private readonly _activeRoute: ActivatedRoute,
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
  ) {
    super();
    this.loadFooterActions$.subscribe();
  }

  public ngOnInit(): void {
    this._initialFormStateMode = this.formState.mode;
    this.steps = this._retrieveSteps();
    const params = this._activeRoute.snapshot.queryParams;
    if (params['resume'] === 'true') {
      Promise.resolve().then(() => this._goToFirstInvalidStep());
    }
    this.modelSnapshot = JSON.stringify(this.model);
    Promise.resolve().then(() => (this.actions = this._retrieveActions(this.nuvStepper?.stepper?.selectedIndex || 0)));
  }

  public trackByFn(_index: number, item: FormlyFieldConfig) {
    return item.id;
  }

  /** Used by the confirmation step to go to another step to edit, should return back to the confirmation step after the user saves */
  public goToStepByKey(stepKey: string) {
    const stepIndex: number = this.field.fieldGroup?.findIndex((step: FormlyFieldConfig<FormlyStepFieldProperties>) => step.props?.stepKey === stepKey) ?? -1;

    if (stepIndex === -1) return;

    this.nuvStepper.stepper.selectedIndex = stepIndex;
    this.returnToReviewStep = true;
  }

  public updateModeByStep(selectedStep: number) {
    this.options.resetModel?.();
    this.updateMode(selectedStep);
  }

  public updateMode(selectedStep: number) {
    this.returnToReviewStep = false;
    const field: FormlyFieldConfig<FormlyStepFieldProperties> = this.field.fieldGroup?.[selectedStep] || {};
    this._formTransactionService.resetFormErrors();

    if (field.props?.stepKey === CONFIRMATION_STEP_KEY) {
      this.formState.mode = FormStateMode.Review;
      this.isConfirmationStep = true;
    } else {
      this.formState.mode = this._initialFormStateMode;
      this.isConfirmationStep = false;
    }

    this.actions = this._retrieveActions(selectedStep);
  }

  public onSave(action: 'next' | 'previous' | 'complete' | 'stepChange' | 'validate', goTo?: number): void {
    const stepField: FormlyFieldConfig<FormlyStepFieldProperties> = this.field.fieldGroup?.[this.nuvStepper.stepper.selectedIndex] || {};
    const stepKey = stepField.props?.stepKey || '';
    const stepForm = this._getAllControlsFromStep(stepField);
    const step = this.steps.find(_step => _step.stepKey === stepKey);
    const stepIndex = this.steps.findIndex(_step => _step.stepKey === stepKey);

    switch (action) {
      case 'previous':
        this.options.resetModel?.();
        this._formTransactionService.resetFormErrors();

        if (this.returnToReviewStep) {
          this.nuvStepper.stepper.selectedIndex = this.steps.length - 1;
        } else {
          this.nuvStepper.stepper.previous();
        }

        this.updateMode(this.nuvStepper.stepper.selectedIndex);

        break;
      case 'next':
        this._partialSaveAndChangeStep(stepField, stepKey, stepForm, this.nuvStepper.stepper.selectedIndex + 1, step);

        break;
      case 'stepChange':
        if (goTo !== undefined) {
          this._partialSaveAndChangeStep(stepField, stepKey, stepForm, goTo, step);
        }

        break;
      case 'complete':
        if (!this.form?.valid) {
          this._handleFormErrors(this.field, this.form);
          MarkAllControlsAsTouched(this.form);

          return;
        }
        this._saveTransaction(true)
          .pipe(
            tap(transaction => {
              transaction && this._router.navigate([`/dashboard/transaction/${transaction.id}/submitted`]);
              this.returnToReviewStep = false;
            }),
          )
          .subscribe();

        break;
      case 'validate':
        if (stepIndex !== -1 && this.field.fieldGroup?.[stepIndex]) {
          this._handleFormErrors(this.field.fieldGroup?.[stepIndex], this.form);
          MarkAllControlsAsTouched(this.form);
        }
        break;
    }
  }

  private _partialSaveAndChangeStep(stepField: FormlyFieldConfig, stepKey: string, stepForm: FormGroup, goTo: number, step?: IStep) {
    if (!stepForm?.valid) {
      this._handleFormErrors(stepField, stepForm);
      MarkAllControlsAsTouched(stepForm);

      return;
    }

    if (step) {
      step.form = stepForm;
    }

    this._saveTransaction(false, stepKey)
      .pipe(
        tap(() => {
          if (this.returnToReviewStep) {
            this.nuvStepper.stepper.selectedIndex = this.steps.length - 1;
          }

          this.nuvStepper.stepper.selectedIndex = goTo;
          this.updateMode(this.nuvStepper.stepper.selectedIndex);
        }),
      )
      .subscribe();
  }
}
