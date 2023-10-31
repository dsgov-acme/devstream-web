import { formioAlphaNumericValidator } from './formio-builder-base.model';

export const defaultPropertyNameConfiguration = {
  input: true,
  inputType: 'text',
  key: 'props.name',
  label: 'Name',
  placeholder: 'Name',
  type: 'textfield',
  validate: {
    formioAlphaNumericValidator,
    required: true,
  },
};

export const defaultPropertyKeyConfiguration = {
  input: true,
  key: 'key',
  label: 'Property key name',
  tooltip: 'The property key of the data model.',
  type: 'textfield',
  validate: {
    formioAlphaNumericValidator,
    required: true,
  },
};
