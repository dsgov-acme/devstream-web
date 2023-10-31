import { Injector } from '@angular/core';
import { FormioCustomComponentInfo, registerCustomFormioComponent } from '@formio/angular';
import {
  DEFAULT_COMPONENT_OPTIONS,
  defaultCompleteConditionalPanelConfiguration,
  defaultConditionalPanelDocumentationLink,
  defaultDisplayBasicConfiguration,
  defaultDisplayPanelConfiguration,
  defaultFieldLabelConfiguration,
  defaultFieldWidthConfiguration,
  defaultHideConditionalConfiguration,
  defaultPanelTabsConfiguration,
  defaultPropertyKeyConfiguration,
  formioAlphaNumericValidator,
} from '../../../base';
import { COUNTRY_OPTIONS, STATE_OPTIONS } from '../formly/formly-address.model';
import { FormioAddressComponent } from './formio-address.component';

/**
 * Formio custom component documentation links
 * Angular formio custom components https://github.com/formio/angular/wiki/Custom-Components-with-Angular-Elements#define-the-options
 * Form builder https://help.form.io/developers/form-builder#overriding-behavior
 * Form builder example json configurations https://formio.github.io/formio.js/app/examples/custombuilder.html
 */

const selector = 'nuverial-address-wc';

const schema = {
  className: 'flex-full',
  components: [
    {
      initialValues: {
        key: 'addressLine1',
      },
      input: true,
      props: {
        label: 'Address Line 1',
        required: true,
      },
    },
    {
      initialValues: {
        key: 'addressLine2',
      },
      input: true,
      props: {
        label: 'Address Line 2 (optional)',
      },
    },
    {
      initialValues: {
        key: 'city',
      },
      input: true,
      props: {
        label: 'City',
        required: true,
      },
    },
    {
      initialValues: {
        key: 'stateCode',
      },
      input: true,
      props: {
        label: 'State',
        required: true,
        selectOptions: STATE_OPTIONS,
      },
    },
    {
      initialValues: {
        key: 'postalCode',
      },
      input: true,
      props: {
        label: 'Zip Code',
        required: true,
      },
    },
    {
      initialValues: {
        key: 'postalCodeExtension',
      },
      input: true,
      props: {
        label: 'Ext. (Optional)',
      },
    },
    {
      initialValues: {
        key: 'countryCode',
      },
      input: true,
      props: {
        label: 'Country',
        required: true,
        selectOptions: COUNTRY_OPTIONS,
      },
    },
  ],
  key: 'address',
  props: {
    label: 'Address',
  },
};

const COMPONENT_OPTIONS: FormioCustomComponentInfo = {
  ...DEFAULT_COMPONENT_OPTIONS,
  editForm, // Optional: define the editForm of the field. Default: the editForm of a textfield
  group: 'nuverialAdvanced', // Build Group
  icon: 'address-card', // Icon
  schema,
  selector, // custom selector. Angular Elements will create a custom html tag with this selector
  title: 'Address', // Title of the component
  type: 'nuverialAddress', // custom type. Formio will identify the field with this type.
  weight: 0, // Optional: define the weight in the builder group
};

export function registerAddressComponent(injector: Injector) {
  if (!customElements.get(selector)) {
    registerCustomFormioComponent(COMPONENT_OPTIONS, FormioAddressComponent, injector);
  }
}

function editForm() {
  return {
    components: [
      {
        // Tabs
        ...defaultPanelTabsConfiguration,
        components: [
          {
            // Display Panel
            ...defaultDisplayPanelConfiguration,
            components: [
              {
                ...defaultDisplayBasicConfiguration,
                components: [
                  { ...defaultFieldLabelConfiguration },
                  { ...defaultPropertyKeyConfiguration },
                  { ...defaultFieldWidthConfiguration },
                  { ...addressFieldsConfiguration },
                ],
              },
              { ...stateSelectOptions },
              { ...countrySelectOptions },
            ],
          },
          {
            // Conditional Panel
            ...conditionalPanel,
          },
        ],
      },
    ],
  };
}

const addressFieldsConfiguration = {
  components: [
    {
      calculateValue: {
        cat: [
          {
            var: 'data.key',
          },
          '.',
          {
            var: 'row.initialValues.key',
          },
        ],
      },
      disabled: true,
      input: true,
      key: 'key',
      label: 'Key',
      type: 'textfield',
    },
    {
      input: true,
      key: 'props.label',
      label: 'Label',
      type: 'textfield',
    },
    {
      disabled: false,
      input: true,
      key: 'hide',
      label: 'Hidden',
      type: 'checkbox',
    },
    {
      disabled: false,
      input: true,
      key: 'props.required',
      label: 'Required',
      type: 'checkbox',
    },
  ],
  disableAddingRemovingRows: true,
  input: true,
  key: 'components',
  label: 'Fields',
  max: 5,
  min: 5,
  reorder: false,
  type: 'datagrid',
  weight: 0,
};

const stateSelectOptions = {
  collapsed: true,
  collapsible: true,
  components: [
    {
      collapsible: true,
      components: [
        {
          input: true,
          key: 'displayTextValue',
          label: 'Label',
          tooltip: 'Display text.',
          type: 'textfield',
        },
        {
          allowCalculateOverride: true,
          calculateValue: 'value = _.camelCase(row.displayTextValue);',
          input: true,
          key: 'key',
          label: 'Value',
          tooltip: 'The key used in code to map to the value.',
          type: 'textfield',
          validate: formioAlphaNumericValidator,
        },
      ],
      defaultValue: [{ label: '', value: '' }],
      input: true,
      key: 'components[3].props.selectOptions',
      label: 'Select Options',
      reorder: true,
      tooltip: 'List of options as key value pairs.',
      type: 'datagrid',
    },
  ],
  key: 'selectOptionsPanel',
  theme: 'default',
  title: 'State Options',
  type: 'panel',
  weight: 10,
};

const countrySelectOptions = {
  collapsed: true,
  collapsible: true,
  components: [
    {
      collapsible: true,
      components: [
        {
          input: true,
          key: 'displayTextValue',
          label: 'Label',
          tooltip: 'Display text.',
          type: 'textfield',
        },
        {
          allowCalculateOverride: true,
          calculateValue: 'value = _.camelCase(row.displayTextValue);',
          input: true,
          key: 'key',
          label: 'Value',
          tooltip: 'The key used in code to map to the value.',
          type: 'textfield',
          validate: formioAlphaNumericValidator,
        },
      ],
      defaultValue: [{ label: '', value: '' }],
      input: true,
      key: 'components[6].props.selectOptions',
      label: 'Select Options',
      reorder: true,
      tooltip: 'List of options as key value pairs.',
      type: 'datagrid',
    },
  ],
  key: 'selectOptionsPanel',
  theme: 'default',
  title: 'Country Options',
  type: 'panel',
  weight: 10,
};

const conditionalPanel = {
  ...defaultCompleteConditionalPanelConfiguration,
  components: [
    {
      ...defaultConditionalPanelDocumentationLink,
    },
    {
      ...defaultHideConditionalConfiguration,
    },
  ],
};
