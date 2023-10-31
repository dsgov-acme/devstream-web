import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, ElementRef, Injector, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormConfigurationModel, IRendererFormConfigurationSchema, ITransactionMetaData, WorkApiRoutesService } from '@dsg/shared/data-access/work-api';
import {
  INuverialBreadCrumb,
  INuverialTab,
  NuverialBreadcrumbComponent,
  NuverialButtonComponent,
  NuverialIconComponent,
  NuverialJsonEditorWrapperComponent,
  NuverialSelectorButtonComponent,
  NuverialSnackBarService,
  NuverialSpinnerComponent,
  NuverialSplitAreaComponent,
  NuverialTabKeyDirective,
  StepperFadeInOut,
} from '@dsg/shared/ui/nuverial';
import { LoggingService } from '@dsg/shared/utils/logging';
import { FormBuilderComponent as FormIOBuilderComponent, FormioForm, FormioModule, FormioOptions } from '@formio/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NgJsonEditorModule } from 'ang-jsoneditor';
import { IOutputData } from 'angular-split';
import { EMPTY, Observable, Subject, Subscription, catchError, finalize, of, switchMap, take, takeUntil, tap } from 'rxjs';
import { FormBuilderModule } from '../../../form-builder.module';
import { FormTransactionService } from '../../../services';
import { registerAddressComponent } from '../../advanced/address';
import { registerFileUploadComponent } from '../../advanced/file-upload';
import { registerLogicValidatorComponent } from '../../advanced/logic-validator';
import { registerCheckboxComponent } from '../../checkbox';
import { registerCheckboxCardComponent } from '../../checkbox-card';
import { registerDatePickerComponent } from '../../date-picker';
import { registerDateRangePickerComponent } from '../../date-range-picker';
import { SchemaKeySelectorComponent } from '../../schema-key-selector/schema-key-selector.component';
import { registerSchemaKeySelectorComponent } from '../../schema-key-selector/schema-key-selector.model';
import { registerSectionHeaderComponent } from '../../section-header';
import { registerSelectComponent } from '../../select';
import { registerSimpleChoiceQuestionsComponent } from '../../simple-choice-questions';
import { overrideWizardPanel } from '../../steps';
import { registerTextAreaComponent } from '../../text-area';
import { registerTextContentComponent } from '../../text-content';
import { registerTextInputComponent } from '../../text-input';
import { BuilderHeaderComponent } from '../header/builder-header.component';
import { FormRendererComponent } from '../renderer/form-renderer.component';
import { AdminBuilderIntakeRendererOptions, AdminBuilderReviewRendererOptions, NuvalenceFormRendererOptions } from '../renderer/renderer.model';
import { FORM_BUILDER_OPTIONS } from './form-builder.model';
import { FormBuilderService } from './form-builder.service';

const CONTEXT = 'FormBuilderComponent';

@UntilDestroy()
@Component({
  animations: [StepperFadeInOut],
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [
    CommonModule,
    NuverialSpinnerComponent,
    FormioModule,
    FormBuilderModule,
    FormRendererComponent,
    NuverialButtonComponent,
    NuverialBreadcrumbComponent,
    NuverialSelectorButtonComponent,
    NuverialJsonEditorWrapperComponent,
    NuverialTabKeyDirective,
    NgJsonEditorModule,
    BuilderHeaderComponent,
    SchemaKeySelectorComponent,
    NuverialSpinnerComponent,
    NuverialSplitAreaComponent,
    NuverialIconComponent,
  ],
  selector: 'dsg-form-builder',
  standalone: true,
  styleUrls: ['./form-builder.component.scss'],
  templateUrl: './form-builder.component.html',
})
export class FormBuilderComponent implements DoCheck, OnDestroy {
  private readonly _formioDestroy = new Subject<void>();

  @ViewChild('splitArea', { read: ElementRef }) public readonly splitAreaRef!: ElementRef<HTMLDivElement>;
  @ViewChild(NuverialSplitAreaComponent) private readonly _splitArea!: NuverialSplitAreaComponent;
  @ViewChild('formio') public set formio(component: FormIOBuilderComponent) {
    if (!component) {
      this._formioDestroy.next();
    }

    if (component) {
      if (!this.formioJson && !Object.keys(this.formioJSONObject.formioJSON).length) {
        this.updateFormRendering(component.form);
        this._cdr.detectChanges();
      }
      component.change
        ?.pipe(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tap((event: any) => {
            if (!['addComponent', 'saveComponent', 'deleteComponent'].includes(event.type)) return;
            this.updateFormRendering(component.form);
          }),
          takeUntil(this._formioDestroy),
          untilDestroyed(this),
        )
        .subscribe();
    }
  }
  public showPreview = false;
  public loading = false;
  public changedElement: Subscription = new Subscription();
  public area2InitialSize = 0;
  private _transactionDefinitionKey!: string;
  private _formKey!: string;
  // formio
  public formio$: Observable<FormioForm> = this._route.paramMap.pipe(
    tap(_ => {
      this.loading = true;
      this._cdr.detectChanges();
    }),
    switchMap(params => {
      this._transactionDefinitionKey = params.get('transactionDefinitionKey') ?? '';
      this._formKey = params.get('formKey') ?? '';
      this._workApiRoutesService
        .getTransactionDefinitionByKey$(this._transactionDefinitionKey)
        .pipe(
          tap(transactionDefinition => {
            this.breadCrumbs[1].label = transactionDefinition.name;
            this.breadCrumbs[1].navigationPath = `${this.breadCrumbs[1].navigationPath}/${this._transactionDefinitionKey}`;
            this.breadCrumbs = structuredClone(this.breadCrumbs);
          }),
        )
        .subscribe();

      return this._formBuilderService.getFormConfigurationByKey$(this._transactionDefinitionKey, this._formKey).pipe();
    }),
    catchError(_error => {
      this._nuverialSnackBarService.notifyApplicationError();

      return EMPTY;
    }),
    tap(_ => {
      this.loading = false;
      this._cdr.detectChanges();
    }),
  );

  // formio
  //public formio$: Observable<FormioForm> = this._formBuilderService.getFormConfiguration$();
  public options = FORM_BUILDER_OPTIONS as FormioOptions;

  // formly
  public readonly intakeFormFields$: Observable<IRendererFormConfigurationSchema[]> = this._formBuilderService.intakeFormFields$;
  public readonly reviewFormFields$: Observable<IRendererFormConfigurationSchema[]> = this._formBuilderService.reviewFormFields$;
  public metaDataFields$: Observable<ITransactionMetaData> = this._formBuilderService.metaDataFields$;

  public intakeRendererOptions: NuvalenceFormRendererOptions = AdminBuilderIntakeRendererOptions;
  public reviewRendererOptions: NuvalenceFormRendererOptions = AdminBuilderReviewRendererOptions;
  public formData$?: Observable<Record<string, unknown>> = of({});

  public formioJson: FormioForm['components'];
  public formlyJson?: IRendererFormConfigurationSchema[];

  public selectorTabs: INuverialTab[] = [
    { key: 'visual', label: 'Visual' },
    { key: 'json', label: 'JSON' },
  ];

  public previewSelectorTabs: INuverialTab[] = [
    { key: 'intake', label: 'Intake' },
    { key: 'review', label: 'Review' },
  ];

  public breadCrumbs: INuverialBreadCrumb[] = [
    { label: 'Transaction Configurations', navigationPath: '/admin/transaction-definitions' },
    { label: '', navigationPath: '/admin/transaction-definitions' },
  ];

  public formioJSONObject = { formioJSON: {} };

  public currentSelectorTab: string = this.selectorTabs[0].key;
  public currentPreviewSelectorTab: string = this.previewSelectorTabs[0].key;

  constructor(
    private readonly _injector: Injector,
    private readonly _formBuilderService: FormBuilderService,
    private readonly _loggingService: LoggingService,
    private readonly _route: ActivatedRoute,
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _workApiRoutesService: WorkApiRoutesService,
    private readonly _renderer: Renderer2,
    private readonly _formTransactionService: FormTransactionService,
  ) {
    overrideWizardPanel();
    registerAddressComponent(this._injector);
    registerSimpleChoiceQuestionsComponent(this._injector);
    registerCheckboxCardComponent(this._injector);
    registerCheckboxComponent(this._injector);
    registerDatePickerComponent(this._injector);
    registerDateRangePickerComponent(this._injector);
    registerFileUploadComponent(this._injector);
    registerSectionHeaderComponent(this._injector);
    registerSelectComponent(this._injector);
    registerTextAreaComponent(this._injector);
    registerTextContentComponent(this._injector);
    registerTextInputComponent(this._injector);
    registerSchemaKeySelectorComponent(this._injector);
    registerLogicValidatorComponent(this._injector);
  }
  public navigationPath!: string;

  public ngOnDestroy(): void {
    this._formTransactionService.cleanUp();
  }

  /*
  This ngDoCheck is needed to maintain the max-width of .mat-horizontal-stepper-header-container for it to be used in the split area.
  Max-width is set to the computed width of the second split area whenever the component doesn't have max-width.
  */
  public ngDoCheck(): void {
    if (
      this.splitAreaRef?.nativeElement?.querySelector('.mat-horizontal-stepper-header-container') &&
      !(this.splitAreaRef.nativeElement.querySelector('.mat-horizontal-stepper-header-container') as HTMLElement).style.maxWidth
    ) {
      this._renderer.setStyle(
        this.splitAreaRef.nativeElement.querySelector('.mat-horizontal-stepper-header-container'),
        'max-width',
        `${this.splitAreaRef.nativeElement.querySelector('.second-area')?.getBoundingClientRect().width}px`,
      );
    }
  }

  // We need to manage the max-width of .mat-horizontal-stepper-header-container whenever the split area is resized
  public onSplitDrag(value: IOutputData) {
    if (this.splitAreaRef?.nativeElement?.querySelector('.mat-horizontal-stepper-header-container')) {
      this._renderer.setStyle(this.splitAreaRef.nativeElement.querySelector('.mat-horizontal-stepper-header-container'), 'max-width', `${value.sizes[1]}px`);
    }
  }

  public onTabSelect(event: string): void {
    this.currentSelectorTab = event;
  }

  public onPreviewTabSelect(event: string): void {
    this.currentPreviewSelectorTab = event;
  }

  public trackByFn(index: number) {
    return index;
  }

  public togglePreview() {
    if (this.showPreview) {
      this._splitArea.setArea2Width(0);
    } else {
      this._splitArea.setArea2Width(window.innerWidth / 2 - 56);
      // This is needed to make sure that the max-width of .mat-horizontal-stepper-header-container
      // is set to the computed width of the second split area, after animation has finished.
      setTimeout(() => {
        if (this.splitAreaRef.nativeElement.querySelector('.mat-horizontal-stepper-header-container')) {
          this._renderer.setStyle(
            this.splitAreaRef.nativeElement.querySelector('.mat-horizontal-stepper-header-container'),
            'max-width',
            `${window.innerWidth / 2 - 56}px`,
          );
        }
      }, 250);
    }
    this.showPreview = !this.showPreview;
    this._cdr.detectChanges();
  }

  public updateFormRendering(formComponents?: FormioForm): void {
    if (!formComponents?.components) return;

    const { formioJson, formlyJson } = this._formBuilderService.updateFormComponents(formComponents.components);

    this._loggingService.log(CONTEXT, 'form configurations', {
      formioJson,
      formlyJson,
      fullFormioJson: formComponents.components,
    });
    this.formioJson = formioJson;
    this.formlyJson = formlyJson;
    this.formioJSONObject.formioJSON = formioJson;
    this.formioJSONObject = structuredClone(this.formioJSONObject);
  }

  public saveChanges(formComponents?: FormioForm): void {
    if (!formComponents?.components) return;
    const formComponentsSchema = new FormConfigurationModel(formComponents.components, true);
    this.loading = true;
    this._cdr.detectChanges();
    this._formBuilderService
      .updateFormConfiguration(formComponentsSchema.toFormioJson(), this._transactionDefinitionKey, this._formKey)
      .pipe(
        catchError(error => {
          this._cdr.detectChanges();
          if (error.status < 200 || error.status >= 300) {
            const errorMessage = error.error.formioValidationErrors[0].errorMessage;
            this._nuverialSnackBarService.notifyApplicationError(errorMessage);
          }

          return EMPTY;
        }),
        take(1),
        finalize(() => {
          this.loading = false;
          this._cdr.detectChanges();
        }),
      )
      .subscribe();
  }
}
