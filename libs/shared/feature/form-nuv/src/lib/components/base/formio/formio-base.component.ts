/* istanbul ignore file */

import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { IFormConfigurationSchema } from '@dsg/shared/data-access/work-api';
import { NuverialValidationErrorType } from '@dsg/shared/ui/nuverial';
import { FormioCustomComponent, FormioEvent } from '@formio/angular';
import { BaseFormlyFieldProperties } from '../formly/formly-base.model';

/**
 * Formio custom component documentation links
 * Angular formio custom components https://github.com/formio/angular/wiki/Custom-Components-with-Angular-Elements#define-the-options
 * Form builder https://help.form.io/developers/form-builder#overriding-behavior
 * Form builder example json configurations https://formio.github.io/formio.js/app/examples/custombuilder.html
 */

// base components are decorated with @Directive()
@Directive()
export class FormioBaseCustomComponent<ValueT, PropsT extends BaseFormlyFieldProperties = BaseFormlyFieldProperties> implements FormioCustomComponent<ValueT> {
  private _props: Partial<PropsT> = {};
  private _validators?: { validation?: string[] };
  private _components?: Array<IFormConfigurationSchema<PropsT>>;

  /** Required by formIO */
  @Input() public value!: ValueT;
  /** Required by formIO */
  @Output() public readonly valueChange = new EventEmitter<ValueT>();
  /** Required by formIO */
  @Input() public disabled!: boolean;
  /** Required by formIO */
  @Output() public readonly formioEvent = new EventEmitter<FormioEvent>();

  @Input() public key!: string;

  /** Template display options are in here
   * The validators defined in here are the validators provided by formly
   * https://formly.dev/docs/examples/validation/built-in-validations
   */
  @Input()
  public set props(props: Partial<PropsT>) {
    if (!props) return;

    this._props = props;

    if (props.required && !this.formControl.hasValidator(Validators.required)) {
      this.formControl.addValidators(Validators.required);
    }

    if (props.minLength && !this.formControl.hasValidator(Validators.minLength(props.minLength))) {
      this.formControl.addValidators(Validators.minLength(props.minLength));
    }

    if (props.maxLength && !this.formControl.hasValidator(Validators.maxLength(props.maxLength))) {
      this.formControl.addValidators(Validators.maxLength(props.maxLength));
    }

    if (props.min && !this.formControl.hasValidator(Validators.min(props.min))) {
      this.formControl.addValidators(Validators.min(props.min));
    }

    if (props.max && !this.formControl.hasValidator(Validators.max(props.max))) {
      this.formControl.addValidators(Validators.max(props.max));
    }

    if (props.pattern && !this.formControl.hasValidator(Validators.pattern(props.pattern))) {
      this.formControl.addValidators(Validators.pattern(props.pattern));
    }
  }
  public get props(): Partial<PropsT> {
    return this._props;
  }

  @Input()
  public set components(components: Array<IFormConfigurationSchema<PropsT>> | undefined) {
    this._components = components;
  }
  public get components(): Array<IFormConfigurationSchema<PropsT>> | undefined {
    return this._components;
  }

  /**
   * Formly puts custom validators in validators
   * https://formly.dev/docs/examples/validation/custom-validation
   */
  @Input()
  public set validators(validators: { validation?: string[] }) {
    if (!validators?.validation) return;

    const { validation } = validators;

    this._validators = validators;

    if (validation.includes('email') && !this.formControl.hasValidator(Validators.email)) {
      this.formControl.addValidators(Validators.email);
    }
  }
  public get validators(): { validation?: string[] } {
    return this._validators || {};
  }

  /** Validation messages */
  @Input() public validation?: { messages?: NuverialValidationErrorType };

  public formControl = new FormControl();

  /** Required by formIO */
  public updateValue(payload: ValueT) {
    this.value = payload; // Should be updated first
    this.valueChange.emit(payload); // Should be called after this.value update
  }

  public trackByFn(index: number) {
    return index;
  }
}
