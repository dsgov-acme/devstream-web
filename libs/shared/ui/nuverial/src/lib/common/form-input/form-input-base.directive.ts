import { Directive, EventEmitter, Injector, Input, Output } from '@angular/core';
import { FormControl, FormControlDirective, FormControlName, FormGroupDirective, NgControl, NgModel, ValidationErrors } from '@angular/forms';
import { combineLatest, Observable, startWith } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { NuverialValidationErrorType } from '../../models';

@Directive({
  exportAs: 'FormInputBaseDirective',
  selector: '[nuverialFormInputBase]',
  standalone: true,
})
export class FormInputBaseDirective {
  private readonly _defaultValidationMessages = {
    datePickerFilter: `Invalid filter`,
    datePickerMax: `Invalid maximum date`,
    datePickerMin: `Invalid minimum date`,
    datePickerParse: `Invalid date format`,
    datePickerRequired: `Required date field`,
    defaultInvalid: `Invalid input field content`,
    defaultRequired: `Required`,
    doesNotMatchOptions: `Does not match options`,
    email: `Invalid email address`,
    fileSize: `File is too large`,
    max: `Invalid maximum value`,
    maxLength: `Invalid maximum length`,
    min: `Invalid minimum value`,
    minLength: `Invalid minimum length`,
    pattern: `Invalid characters`,
    required: `Required`,
    requiredTrue: `Required`,
  };

  /**
   * Validation error messages by validation error type
   */
  @Input() public validationMessages?: NuverialValidationErrorType;
  /**
   * Event emitter containing array of all validation error messages
   */
  @Output() public readonly validationErrors = new EventEmitter<NuverialValidationErrorType[]>();

  /**
   * Observable for validation error message
   */
  public error$!: Observable<string>;

  @Input() public formControl!: FormControl;
  protected _formValue!: unknown;
  protected _ngControl!: NgControl;
  protected readonly _injector!: Injector;

  /**
   * Material uses custom validation rules that don't want to expose outside of library
   * reqister function to map to replace
   * @protected
   */
  protected _convertMaterialValidationErrors!: (errors: ValidationErrors | null) => ValidationErrors | null;

  public onTouched: () => unknown = () => {
    // required and defined ControlValueAccessor
  };

  protected _controlValueAccessorChangeFn: (value: unknown) => void = () => {
    // required and defined ControlValueAccessor
  };

  // Implemented as part of ControlValueAccessor.
  public registerOnChange(_fn: (value: unknown) => void) {
    this._controlValueAccessorChangeFn = _fn;
  }

  public registerOnTouched(fn: () => unknown) {
    this.onTouched = fn;
  }

  public writeValue(value: unknown) {
    this._formValue = value;
  }
  /**
   * Initial form controls and event observables should be typically called by OnInit
   * @protected
   */
  protected _initErrorHandler(events?: Observable<unknown>) {
    if (this.formControl && events) {
      this.error$ = combineLatest([events.pipe(startWith(null)), this.formControl.statusChanges.pipe(startWith(null))]).pipe(
        filter(([event, _status]) => event === null),
        map(([_event, _status]) => {
          let { errors } = this.formControl;
          if (this._convertMaterialValidationErrors) {
            errors = this._convertMaterialValidationErrors(errors);
          }

          return (
            errors &&
            Object.keys(errors).map(key => ({
              [key]: this._validationMessage(key, this.validationMessages),
            }))
          );
        }),
        tap(errors => errors && this.validationErrors.emit(errors)),
        map(errors => (errors ? Object.keys(errors[0]).map(key => errors[0][key])[0] : '')),
      );
    }
  }

  /**
   * Return FormControl from injected NgControl object
   * @protected
   */
  protected _modelFormControl(): FormControl {
    let formControl!: FormControl;

    try {
      this._ngControl = this._injector.get(NgControl);

      switch (this._ngControl.constructor) {
        case NgModel:
          formControl = (this._ngControl as NgModel).control;
          break;

        case FormControlName:
          formControl = this._injector.get(FormGroupDirective).getControl(this._ngControl as FormControlName);
          break;

        case FormControlDirective:
          formControl = this._ngControl.control as FormControl;
          break;
      }
    } catch {
      formControl = this.formControl;
    }

    // formControl should never be undefined when this.formControl is defined, but we fall back incase
    return formControl || this.formControl;
  }

  /**
   * Return validation message from supplied configuration
   * @param fieldName
   * @param nuverialConfiguration
   * @param validationMessages
   * @protected
   */
  protected _validationMessage(fieldName: string, validationErrorType: NuverialValidationErrorType | undefined): string {
    const defaults: NuverialValidationErrorType = this._defaultValidationMessages;
    const defaultKey = fieldName === 'required' ? 'defaultRequired' : 'defaultInvalid';

    if (validationErrorType && validationErrorType[fieldName]) {
      return validationErrorType[fieldName];
    }

    return defaults[fieldName] ? defaults[fieldName] : defaults[defaultKey];
  }
}
