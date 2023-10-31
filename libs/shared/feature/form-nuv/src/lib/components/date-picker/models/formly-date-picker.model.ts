import { BaseFormlyFieldProperties } from '../../base';

export interface DatePickerFieldProperties extends BaseFormlyFieldProperties {
  inputLabel?: string;
  maxDate?: Date;
  minDate?: Date;
  opened?: boolean;
  startAt?: Date;
  startView?: 'month' | 'year' | 'multi-year';
  autocomplete?: string;
}
