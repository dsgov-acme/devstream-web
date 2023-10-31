import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { LoggingService } from '@dsg/shared/utils/logging';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { render } from '@testing-library/angular';
import { axe } from 'jest-axe';
import { MockProvider } from 'ng-mocks';
import { MockDefaultComponentProperties, MockDefaultFormlyModuleConfiguration, MockTemplate } from '../../../../test';
import { FormStateMode } from '../../../forms';
import { FormlySectionHeaderComponent } from '../../../section-header';
import { FormlySelectComponent } from '../../../select';
import { FormlyTextInputComponent } from '../../../text-input';
import { FormlyAddressComponent } from './formly-address.component';
import { COUNTRY_OPTIONS, STATE_OPTIONS } from './formly-address.model';

const mockModel = {
  personalInformation: {
    currentAddress: {
      addressLine1: '1234 first St',
      addressLine2: 'line 2',
      city: 'troy',
      countryCode: 'US',
      countryLabel: 'United States',
      postalCode: '55555',
      postalCodeExtension: '1234',
      stateCode: 'NY',
    },
  },
};

const mockFields: FormlyFieldConfig[] = [
  {
    className: 'flex-full',
    fieldGroup: [
      {
        key: 'personalInformation.currentAddress.addressLine1',
        props: {
          label: 'Address Line 1',
          required: true,
        },
      },
      {
        key: 'personalInformation.currentAddress.addressLine2',
        props: {
          label: 'Address Line 2 (optional)',
        },
      },
      {
        key: 'personalInformation.currentAddress.city',
        props: {
          label: 'City',
          required: true,
        },
      },
      {
        key: 'personalInformation.currentAddress.stateCode',
        props: {
          label: 'State',
          required: true,
          selectOptions: STATE_OPTIONS,
        },
      },
      {
        key: 'personalInformation.currentAddress.postalCode',
        props: {
          label: 'Zip Code',
          required: true,
        },
      },
      {
        key: 'personalInformation.currentAddress.postalCodeExtension',
        props: {
          label: 'Ext. (Optional)',
        },
      },
      {
        key: 'personalInformation.currentAddress.countryCode',
        props: {
          label: 'Country',
          required: true,
          selectOptions: COUNTRY_OPTIONS,
        },
      },
    ],
    key: 'personalInformation.currentAddress',
    props: {
      label: 'Current Address',
    },
    type: 'nuverialAddress',
  },
];

const getFixtureByTemplate = async (props?: Record<string, unknown>) => {
  const template = MockTemplate;
  const { fixture } = await render(template, {
    componentProperties: {
      ...MockDefaultComponentProperties,
      fields: mockFields,
      model: mockModel,
      ...props,
    },
    imports: [
      ReactiveFormsModule,
      FormlyModule.forRoot({
        ...MockDefaultFormlyModuleConfiguration,
        types: [
          { component: FormlyAddressComponent, name: 'nuverialAddress' },
          { component: FormlySectionHeaderComponent, name: 'nuverialSectionHeader' },
          { component: FormlyTextInputComponent, name: 'nuverialTextInput' },
          { component: FormlySelectComponent, name: 'nuverialSelect' },
          { component: FormlySelectComponent, name: 'nuverialCheckbox' },
        ],
      }),
    ],
    providers: [MockProvider(LoggingService)],
  });

  const component = fixture.debugElement.query(By.directive(FormlyAddressComponent)).componentInstance;

  return { component, fixture };
};

describe('FormlyAddressComponent', () => {
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting(),
      { teardown: { destroyAfterEach: false } }, // required in formly tests
    );
  });

  it('should create', async () => {
    const { fixture } = await getFixtureByTemplate();

    expect(fixture).toBeTruthy();
  });

  describe('Accessibility', () => {
    it('should have no violations', async () => {
      const { fixture } = await getFixtureByTemplate();
      const axeResults = await axe(fixture.nativeElement);

      expect(axeResults).toHaveNoViolations();
    });
  });

  it('should verify the that only the current address components are loaded', async () => {
    const { fixture } = await getFixtureByTemplate();

    expect(fixture.nativeElement.querySelectorAll('dsg-formly-section-header').length).toEqual(1);
    expect(fixture.nativeElement.querySelector('nuverial-section-header h2').innerHTML).toEqual('Current Address');
    expect(fixture.nativeElement.querySelector('#personalInformation\\.currentAddress\\.addressLine1-field mat-label').innerHTML).toEqual('Address Line 1');
    expect(fixture.nativeElement.querySelector('#personalInformation\\.currentAddress\\.addressLine2-field mat-label').innerHTML).toEqual(
      'Address Line 2 (optional)',
    );
    expect(fixture.nativeElement.querySelector('#personalInformation\\.currentAddress\\.city-field mat-label').innerHTML).toEqual('City');
    expect(fixture.nativeElement.querySelector('#personalInformation\\.currentAddress\\.stateCode-field mat-label').innerHTML).toEqual('State');
    expect(fixture.nativeElement.querySelector('#personalInformation\\.currentAddress\\.postalCode-field mat-label').innerHTML).toEqual('Zip Code');
    expect(fixture.nativeElement.querySelector('#personalInformation\\.currentAddress\\.postalCodeExtension-field mat-label').innerHTML).toEqual(
      'Ext. (Optional)',
    );
    expect(fixture.nativeElement.querySelector('#personalInformation\\.currentAddress\\.countryCode-field mat-label').innerHTML).toEqual('Country');
  });

  it('should verify the review mode', async () => {
    const { component, fixture } = await getFixtureByTemplate();
    const reviewDetails = {
      addressLine1: '1234 first St',
      addressLine2: 'line 2',
      city: 'troy',
      countryCode: 'US',
      countryLabel: 'United States',
      isMailingAddressDifferent: undefined,
      postalCode: '55555',
      postalCodeExtension: '1234',
      stateCode: 'NY',
    };

    component.formState.mode = FormStateMode.Edit;
    fixture.detectChanges();

    expect(component.reviewDetails).toEqual(reviewDetails);
  });
});
