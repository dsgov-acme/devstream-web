import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  FormConfigurationModel,
  FormioConfigurationMock,
  FormioConfigurationTestMock,
  FormlyConfigurationTestMock,
  IForm,
  TransactionMetadataMock,
  UglyFormioConfigurationTestMock,
  WorkApiRoutesService,
} from '@dsg/shared/data-access/work-api';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { FormBuilderService } from './form-builder.service';

global.structuredClone = (val: unknown) => JSON.parse(JSON.stringify(val));
const formWrapper: IForm = {
  configuration: {
    components: FormioConfigurationMock,
  },
  configurationSchema: '',
  createdBy: 'system',
  description: '',
  formKey: '',
  lastUpdatedBy: 'system',
  name: '',
  schemaKey: '',
  taskName: 'wizard',
  transactionDefinitionKey: '',
};
const transactionDefinitionKey = 'transactionDefinitionKey';
const formKey = 'formKey';

describe('FormBuilderService', () => {
  let service: FormBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MockProvider(WorkApiRoutesService, {
          getFormConfigurationByKey$: jest.fn().mockImplementation(() => of(formWrapper)),
          updateFormConfiguration$: jest.fn().mockImplementation(() => of(formWrapper)),
        }),
      ],
    });
    service = TestBed.inject(FormBuilderService);

    jest.spyOn(service['_initialFormComponents'], 'next');
    jest.spyOn(service['_updatedFormComponents'], 'next');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFormConfigurationByKey$', () => {
    it('should get create authenticationModel model from schema', done => {
      const formConfigurationModel = new FormConfigurationModel(FormioConfigurationMock);

      service.getFormConfigurationByKey$(transactionDefinitionKey, formKey).subscribe(formConfiguration => {
        expect(formConfiguration).toEqual({
          components: FormioConfigurationMock,
          display: 'wizard',
        });
        expect(service['_initialFormComponents'].next).toHaveBeenCalledWith(formConfigurationModel);
        expect(service['_updatedFormComponents'].next).toHaveBeenCalledWith(formConfigurationModel);

        done();
      });
    });
  });

  describe('reviewFormFields$', () => {
    it('should convert formio json to formly json', done => {
      service.reviewFormFields$.subscribe(formConfiguration => {
        expect(formConfiguration).toEqual([
          {
            className: 'flex-full',
            fieldGroup: FormlyConfigurationTestMock,
            type: 'nuverialSteps',
          },
        ]);

        done();
      });

      service['_updatedFormComponents'].next(new FormConfigurationModel(FormioConfigurationTestMock));
    });
  });

  describe('updateFormComponents', () => {
    it('should update the form components json', () => {
      const updatedFormJson = service.updateFormComponents(UglyFormioConfigurationTestMock);
      const formConfigurationModel = new FormConfigurationModel(UglyFormioConfigurationTestMock, true);

      expect(service['_updatedFormComponents'].next).toHaveBeenCalledWith(formConfigurationModel);
      expect(updatedFormJson).toEqual({
        formioJson: FormioConfigurationTestMock,
        formlyJson: FormlyConfigurationTestMock,
      });
    });
  });

  describe('updateMetaData', () => {
    it('should update the form metadata', done => {
      service['_formWrapper'] = formWrapper;
      const metaData = TransactionMetadataMock;

      service.updateMetaData(metaData).subscribe(updatedMetaData => {
        expect(updatedMetaData).toEqual(metaData);
        done();
      });
    });
  });
});
