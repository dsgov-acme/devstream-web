import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injector, ViewChild } from '@angular/core';
import { ISchemaMetaData } from '@dsg/shared/data-access/work-api';
import {
  INuverialBreadCrumb,
  INuverialTab,
  NuverialBreadcrumbComponent,
  NuverialButtonComponent,
  NuverialIconComponent,
  NuverialJsonEditorWrapperComponent,
  NuverialSelectorButtonComponent,
  NuverialSpinnerComponent,
  NuverialSplitAreaComponent,
  StepperFadeInOut,
} from '@dsg/shared/ui/nuverial';
import { FormBuilderComponent as FormIOBuilderComponent, FormioModule, FormioOptions } from '@formio/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject, takeUntil } from 'rxjs';
import { SchemaBuilderModule } from '../../../schema-builder.module';
import { BuilderHeaderComponent } from '../header/schema-builder-header.component';
import { registerStringComponent } from '../../string';
import { registerBooleanComponent } from '../../boolean';
import { registerIntegerComponent } from '../../integer';
import { registerBigDecimalComponent } from '../../big-decimal';
import { registerLocalDateComponent } from '../../local-date';
import { registerLocalTimeComponent } from '../../local-time';
import { FORM_BUILDER_OPTIONS } from './schema-builder.model';

@UntilDestroy()
@Component({
  animations: [StepperFadeInOut],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormioModule,
    SchemaBuilderModule,
    NuverialSplitAreaComponent,
    NuverialSpinnerComponent,
    NuverialBreadcrumbComponent,
    BuilderHeaderComponent,
    NuverialSelectorButtonComponent,
    NuverialButtonComponent,
    NuverialIconComponent,
    NuverialJsonEditorWrapperComponent,
  ],
  selector: 'dsg-schema-builder',
  standalone: true,
  styleUrls: ['./schema-builder.component.scss'],
  templateUrl: './schema-builder.component.html',
})
export class SchemaBuilderComponent {
  private readonly _formioDestroy = new Subject<void>();

  @ViewChild('formio') public set formio(component: FormIOBuilderComponent) {
    if (!component) {
      this._formioDestroy.next();
    }

    if (component) {
      component.change?.pipe(takeUntil(this._formioDestroy), untilDestroyed(this)).subscribe();
    }
  }

  constructor(private readonly _injector: Injector) {
    registerStringComponent(this._injector);
    registerBooleanComponent(this._injector);
    registerIntegerComponent(this._injector);
    registerBigDecimalComponent(this._injector);
    registerLocalDateComponent(this._injector);
    registerLocalTimeComponent(this._injector);
  }

  public loading = false;
  public options = FORM_BUILDER_OPTIONS as FormioOptions;

  public metaDataFields: ISchemaMetaData = {
    createdBy: 'Julian Giraldo',
    description: 'Schema Description',
    lastUpdatedBy: 'Julian Giraldo',
    name: 'Common Address',
    schemaKey: 'CommonAddress',
    status: 'Unpublished',
  } as ISchemaMetaData;

  public selectorTabs: INuverialTab[] = [
    { key: 'visual', label: 'Visual' },
    { key: 'json', label: 'JSON' },
  ];

  public breadCrumbs: INuverialBreadCrumb[] = [
    { label: 'Schemas', navigationPath: '/admin/schemas' },
    { label: 'New Schema', navigationPath: '/admin/schemas/builder' },
  ];

  public formioJSONObject = { formioJSON: {} };

  public currentSelectorTab: string = this.selectorTabs[0].key;
}
