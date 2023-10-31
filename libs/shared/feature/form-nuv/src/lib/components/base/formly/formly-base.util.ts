import { FormlyFieldConfig } from '@ngx-formly/core';
import { BaseAdvancedFormlyFieldProperties } from './formly-base.model';

/**
 * Used for pre-populating an advanced field group.
 * Set the key to undefined to:
 * - handle expressions on the field
 * - Handle mapping the form data to the correct place
 */
export function handleAdvancedFieldGroupKey(field: FormlyFieldConfig<BaseAdvancedFormlyFieldProperties>): void {
  if (isPrePopulated(field)) return;

  field.props = {
    ...field.props,
    key: field.key, // set the key in props for later use
    populated: true, // set populated to true to prevent running this again
  };
  field.key = undefined;
}

export function isPrePopulated(field: FormlyFieldConfig<BaseAdvancedFormlyFieldProperties>): boolean {
  return !!field.props?.populated;
}
