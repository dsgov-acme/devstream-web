import { FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { render } from '@testing-library/angular';
import { axe } from 'jest-axe';
import { MockBuilder, MockService } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { NuverialFormFieldErrorComponent } from '../form-field-error';
import { NuverialIconComponent } from '../icon';
import { NuverialDatePickerComponent } from './date-picker.component';

const focusEvents = new Subject<FocusOrigin | null>();
const focusMonitor = MockService(FocusMonitor, {
  monitor: () => of(null),
});

const dependencies = MockBuilder()
  .keep(NuverialDatePickerComponent, { shallow: false })
  .keep(CommonModule)
  .keep(FormsModule)
  .keep(ReactiveFormsModule)
  .keep(MatDatepickerModule)
  .keep(MatInputModule)
  .keep(MatFormFieldModule)
  .keep(MatNativeDateModule)
  .keep(NuverialIconComponent)
  .keep(NuverialFormFieldErrorComponent)
  .mock(FocusMonitor, focusMonitor)
  .build();

describe('DatePicker Component', () => {
  it('should not initialize without NgControl', async () => {
    const template = `<nuverial-date-picker ariaLabel="Aria label"></nuverial-date-picker>`;

    try {
      await render(template, { ...dependencies });
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });
  describe('Accessibility', () => {
    it('should have no violations when ariaLabel is set', async () => {
      const { fixture } = await render(NuverialDatePickerComponent, {
        ...dependencies,
        componentProperties: {
          ariaLabel: 'Aria label',
          formControl: new FormControl(null, [Validators.required]),
        },
      });

      const axeResults = await axe(fixture.nativeElement);

      expect(axeResults).toHaveNoViolations();
    });

    it('should have no violations when inputLabel is set', async () => {
      const { fixture } = await render(NuverialDatePickerComponent, {
        ...dependencies,
        componentProperties: {
          formControl: new FormControl(null, [Validators.required]),
          inputLabel: 'Input label',
        },
      });
      const axeResults = await axe(fixture.nativeElement);

      expect(axeResults).toHaveNoViolations();
    });

    it('should have violations when neither inputLabel or ariaLabel are set', async () => {
      const { fixture } = await render(NuverialDatePickerComponent, {
        ...dependencies,
        componentProperties: {
          formControl: new FormControl(null, [Validators.required]),
        },
      });
      const axeResults = await axe(fixture.nativeElement);

      expect(axeResults).not.toHaveNoViolations();
    });
  });

  it('should be in invalid state', async () => {
    const errorsSpy = jest.fn();
    const template = `<nuverial-date-picker data-testid="datepicker" [formControl]="dateFormControl" (validationErrors)="onValidationErrors($event)"></nuverial-date-picker>`;
    const fixture = await render(template, {
      ...dependencies,
      componentProperties: {
        dateFormControl: new FormControl(null, [Validators.required]),
        onValidationErrors: errorsSpy,
      },
    });

    focusEvents.next(null);
    fixture.detectChanges();

    expect(errorsSpy).toHaveBeenLastCalledWith([{ required: 'Required' }]);
  });

  it('should be in invalid state no error display', async () => {
    const errorsSpy = jest.fn();
    const template = `<nuverial-date-picker data-testid="datepicker" [displayError]="false"[formControl]="dateFormControl" (validationErrors)="onValidationErrors($event)"></nuverial-date-picker>`;
    const fixture = await render(template, {
      ...dependencies,
      componentProperties: {
        dateFormControl: new FormControl(null, [Validators.required]),
        onValidationErrors: errorsSpy,
      },
    });

    focusEvents.next(null);
    fixture.detectChanges();

    expect(errorsSpy).toHaveBeenLastCalledWith([{ required: 'Required' }]);
  });

  it('should be in valid state', async () => {
    const errorsSpy = jest.fn();
    const formControl = new FormControl(new Date(), [Validators.required]);
    const template = `<nuverial-date-picker data-testid="datepicker" [formControl]="dateFormControl" (validationErrors)="onValidationErrors($event)"></nuverial-date-picker>`;
    const fixture = await render(template, {
      ...dependencies,
      componentProperties: {
        dateFormControl: formControl,
        onValidationErrors: errorsSpy,
      },
    });

    focusEvents.next(null);
    fixture.detectChanges();

    expect(errorsSpy).toBeCalledTimes(0);
  });

  it('should be detect valid/invalid min date', async () => {
    const errorsSpy = jest.fn();
    const currentYear = new Date().getFullYear();
    const formControl = new FormControl(new Date(), [Validators.required]);
    const template = `<nuverial-date-picker data-testid="datepicker" [formControl]="dateFormControl" [maxDate]="maxDate" [minDate]="minDate" (validationErrors)="onValidationErrors($event)"></nuverial-date-picker>`;
    const fixture = await render(template, {
      ...dependencies,
      componentProperties: {
        dateFormControl: formControl,
        maxDate: new Date(currentYear, 12, 31),
        minDate: new Date(currentYear, 1, 1),
        onValidationErrors: errorsSpy,
      },
    });

    fixture.detectChanges();
    focusEvents.next(null);

    expect(errorsSpy).toBeCalledTimes(0);

    formControl.setValue(new Date(currentYear - 1, 1, 1));
    fixture.detectChanges();
    focusEvents.next(null);

    expect(errorsSpy).toBeCalledTimes(1);
  });

  it('should be detect valid/invalid max date', async () => {
    const errorsSpy = jest.fn();
    const currentYear = new Date().getFullYear();
    const formControl = new FormControl(new Date(), [Validators.required]);
    const template = `<nuverial-date-picker data-testid="datepicker" [formControl]="dateFormControl" [maxDate]="maxDate" [minDate]="minDate" (validationErrors)="onValidationErrors($event)"></nuverial-date-picker>`;
    const fixture = await render(template, {
      ...dependencies,
      componentProperties: {
        dateFormControl: formControl,
        maxDate: new Date(currentYear, 12, 31),
        minDate: new Date(currentYear, 1, 1),
        onValidationErrors: errorsSpy,
      },
    });

    fixture.detectChanges();
    focusEvents.next(null);

    expect(errorsSpy).toBeCalledTimes(0);

    formControl.setValue(new Date(currentYear + 2, 1, 1));
    fixture.detectChanges();
    focusEvents.next(null);

    expect(errorsSpy).toBeCalledTimes(1);
  });

  it('should error on invalid date format', async () => {
    const { fixture } = await render(NuverialDatePickerComponent, {
      ...dependencies,
      componentProperties: {
        formControl: new FormControl(new Date(), [Validators.required]),
      },
    });
    const component = fixture.componentInstance;
    jest.spyOn(component.validationErrors, 'emit');

    component.formControl.setValue({
      matDatepickerParse: {
        text: '01011970',
      },
    });

    focusEvents.next(null);
    fixture.detectChanges();
    expect(component.validationErrors.emit).toHaveBeenCalledWith([{ datePickerParse: 'Invalid date format' }]);
  });

  it('should be in valid date format', async () => {
    const { fixture } = await render(NuverialDatePickerComponent, {
      ...dependencies,
      componentProperties: {
        formControl: new FormControl(new Date(), [Validators.required]),
      },
    });
    const component = fixture.componentInstance;
    jest.spyOn(component.validationErrors, 'emit');

    component.formControl.setValue('1970-01-01');

    focusEvents.next(null);
    fixture.detectChanges();
    expect(component.validationErrors.emit).toBeCalledTimes(0);
  });
});
