import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { INuverialSelectOption, NuverialSectionHeaderComponent, NuverialTextInputComponent } from '@dsg/shared/ui/nuverial';
import { FormlyExtension, FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { FormlyBaseComponent } from '../../../base';
import { handleAdvancedFieldGroupKey, isPrePopulated } from '../../../base/formly/formly-base.util';
import { FormlyAddressFieldProperties } from './formly-address.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormlyModule, NuverialSectionHeaderComponent, NuverialTextInputComponent],
  selector: 'dsg-formly-address',
  standalone: true,
  styleUrls: ['./formly-address.component.scss'],
  templateUrl: './formly-address.component.html',
})
export class FormlyAddressComponent extends FormlyBaseComponent<FormlyAddressFieldProperties> implements FormlyExtension, OnInit {
  public countrySelectLabels = new Map();

  public prePopulate(field: FormlyFieldConfig<FormlyAddressFieldProperties>): void {
    if (isPrePopulated(field)) return;

    handleAdvancedFieldGroupKey(field);

    const fieldGroup = [
      {
        className: 'flex-full',
        props: {
          label: field.props?.label || 'Address',
        },
        type: 'nuverialSectionHeader',
      },
      ...(field.fieldGroup || []),
    ].map(_field => {
      switch (true) {
        case _field.key?.toString().endsWith('addressLine1'):
          return {
            ..._field,
            className: 'flex-half',
            props: {
              ..._field.props,
              autocomplete: 'address-line1',
              type: 'text',
            },
            type: 'nuverialTextInput',
          };
        case _field.key?.toString().endsWith('addressLine2'):
          return {
            ..._field,
            className: 'flex-half',
            props: {
              ..._field.props,
              autocomplete: 'address-line2',
              type: 'text',
            },
            type: 'nuverialTextInput',
          };
        case _field.key?.toString().endsWith('city'):
          return {
            ..._field,
            className: 'flex-half',
            props: {
              ..._field.props,
              autocomplete: 'address-level2',
              type: 'text',
            },
            type: 'nuverialTextInput',
          };
        case _field.key?.toString().endsWith('stateCode'):
          return {
            ..._field,
            className: 'flex-half',
            props: {
              ..._field.props,
              autocomplete: 'address-level1',
            },
            type: 'nuverialSelect',
          };
        case _field.key?.toString().endsWith('postalCode'):
          return {
            ..._field,
            className: 'flex-quarter',
            props: {
              ..._field.props,
              autocomplete: 'postal-code',
              type: 'text',
            },
            type: 'nuverialTextInput',
          };
        case _field.key?.toString().endsWith('postalCodeExtension'):
          return {
            ..._field,
            className: 'flex-quarter',
            props: {
              ..._field.props,
              type: 'text',
            },
            type: 'nuverialTextInput',
          };
        case _field.key?.toString().endsWith('countryCode'):
          return {
            ..._field,
            className: 'flex-half',
            props: {
              ..._field.props,
              autocomplete: 'country',
            },
            type: 'nuverialSelect',
          };
        default:
          return _field;
      }
    });

    field.fieldGroup = fieldGroup;
  }

  public ngOnInit(): void {
    this.field.fieldGroup
      ?.find(field => field.key === `${this.field.props.key}.countryCode`)
      ?.props?.['selectOptions']?.forEach((option: INuverialSelectOption) => this.countrySelectLabels.set(option.key, option.displayTextValue));
  }

  public trackByFn(_index: number, item: FormlyFieldConfig) {
    return item.id;
  }

  public get reviewDetails() {
    const model = this.form.get(this.field.props?.key?.toString() || '')?.value;

    return {
      ...model,
      countryLabel: this.countrySelectLabels.get(model.countryCode),
    };
  }
}
