import { Injector } from '@angular/core';
import { FormioCustomComponentInfo, registerCustomFormioComponent } from '@formio/angular';
import { DEFAULT_COMPONENT_OPTIONS, defaultPropertyKeyConfiguration, defaultPropertyNameConfiguration } from '../../base';
import { AttributeTypes, typeToIconMap } from '../../base/formio/formio-attribute-base.model';
import { FormioLocalDateComponent } from './formio-local-date.component';

/**
 * Formio custom component documentation links
 * Angular formio custom components https://github.com/formio/angular/wiki/Custom-Components-with-Angular-Elements#define-the-options
 * Form builder https://help.form.io/developers/form-builder#overriding-behavior
 * Form builder example json configurations https://formio.github.io/formio.js/app/examples/custombuilder.html
 */

const type = AttributeTypes.LOCALDATE;
const selector = `${type.toLowerCase()}-wc`;
const icon = typeToIconMap.get(type) || '';

const COMPONENT_OPTIONS: FormioCustomComponentInfo = {
  ...DEFAULT_COMPONENT_OPTIONS,
  editForm, // Optional: define the editForm of the field. Default: the editForm of a textfield
  group: 'attributes', // Build Group
  icon: icon, // Icon
  schema: { props: { icon: icon, type: type } },
  selector, // custom selector. Angular Elements will create a custom html tag with this selector
  title: type, // Title of the component
  type: type, // custom type. Formio will identify the field with this type.
  weight: 0, // Optional: define the weight in the builder group
};

export function registerLocalDateComponent(injector: Injector) {
  if (!customElements.get(selector)) {
    registerCustomFormioComponent(COMPONENT_OPTIONS, FormioLocalDateComponent, injector);
  }
}

function editForm() {
  return {
    components: [
      {
        // fields
        components: [{ ...defaultPropertyNameConfiguration }, { ...defaultPropertyKeyConfiguration }],
      },
    ],
  };
}
