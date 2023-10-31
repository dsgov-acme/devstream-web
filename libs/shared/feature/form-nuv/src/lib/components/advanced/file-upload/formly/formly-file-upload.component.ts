import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { NuverialAccordionComponent, NuverialFileUploadComponent, NuverialSectionHeaderComponent } from '@dsg/shared/ui/nuverial';
import { FormlyExtension, FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { FormlyBaseComponent } from '../../../base';
import { handleAdvancedFieldGroupKey, isPrePopulated } from '../../../base/formly/formly-base.util';
import { FileUploadFieldProperties } from '../models/formly-file-upload.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormlyModule, NuverialFileUploadComponent, NuverialAccordionComponent, NuverialSectionHeaderComponent],
  selector: 'dsg-formly-file-upload',
  standalone: true,
  styleUrls: ['./formly-file-upload.component.scss'],
  templateUrl: './formly-file-upload.component.html',
})
export class FormlyFileUploadComponent extends FormlyBaseComponent<FileUploadFieldProperties> implements FormlyExtension {
  public prePopulate(field: FormlyFieldConfig<FileUploadFieldProperties>): void {
    if (isPrePopulated(field)) return;

    handleAdvancedFieldGroupKey(field);

    const fieldGroup = field.fieldGroup?.map(_field => {
      return {
        ..._field,
        className: 'flex-half',
        type: 'nuverialFileUploader',
      };
    });

    field.fieldGroup = fieldGroup;
  }

  public get formControls(): Array<AbstractControl | null> {
    const controlsArray: Array<AbstractControl | null> = [];
    this.field.fieldGroup?.forEach(field => {
      if (field.key) {
        controlsArray.push(this.formControl.get(field.key.toString()));
      }
    });

    return controlsArray;
  }

  public trackByFn(index: number) {
    return index;
  }
}
