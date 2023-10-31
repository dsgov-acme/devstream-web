import {
  defaultConditionalPanelConfiguration,
  defaultConditionalPanelDocumentationLink,
  defaultDisplayBasicConfiguration,
  defaultDisplayPanelConfiguration,
  defaultFieldLabelConfiguration,
  defaultHideConditionalConfiguration,
  defaultPanelTabsConfiguration,
  defaultPropertyKeyConfiguration,
} from '../../base';

/**
 * Formio documentation for overriding existing components
 * https://help.form.io/developers/form-builder#overriding-behavior
 */

declare let window: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ['Formio']: any;
};

export function overrideWizardPanel() {
  const wizardPanel = window.Formio.Components.components.panel;
  wizardPanel.schema = function () {
    return { input: true };
  };
  wizardPanel.editForm = function () {
    return editForm();
  };
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
                components: [{ ...stepFormioTitleConfiguration }, { ...defaultFieldLabelConfiguration }, { ...defaultPropertyKeyConfiguration }],
              },
            ],
          },
          {
            // Conditional Panel
            ...defaultConditionalPanelConfiguration,
            components: [
              {
                ...defaultConditionalPanelDocumentationLink,
              },
              {
                ...defaultHideConditionalConfiguration,
              },
            ],
          },
        ],
      },
    ],
  };
}

/** This title is used by the formio wizard pages tabs */
const stepFormioTitleConfiguration = {
  calculateValue: {
    '*': [{ var: 'data.props.label' }],
  },
  key: 'title',
  type: 'hidden',
  weight: 0,
};
