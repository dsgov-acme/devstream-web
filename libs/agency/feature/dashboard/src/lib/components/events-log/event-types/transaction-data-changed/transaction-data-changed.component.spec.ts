/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  AuditEventDataUpdatedModelMock,
  AuditEventDataUpdatedNullOldStateModelMock,
  AuditEventDataUpdatedNuverialAddressModelMock,
  AuditEventDataUpdatedNuverialFileUploadtModelMock,
  AuditEventDataUpdatedNuverialSelectModelMock,
  AuditEventFormioConfigurationNuverialAddressMock,
  AuditEventModel,
} from '@dsg/shared/data-access/audit-api';
import { FormConfigurationModel, FormioConfigurationMock } from '@dsg/shared/data-access/work-api';
import { DocumentFormService } from '@dsg/shared/feature/form-nuv';
import { of } from 'rxjs';
import { TransactionDataChangedComponent } from './transaction-data-changed.component';

describe('TransactionDataChangedComponent', () => {
  let component: TransactionDataChangedComponent;
  let fixture: ComponentFixture<TransactionDataChangedComponent>;
  let auditEventDataUpdatedModelMock: AuditEventModel;

  const mockFormComponent = {
    key: 'personalInformation.lastName',
    props: {
      label: 'Last Name',
    },
  };

  beforeEach(async () => {
    auditEventDataUpdatedModelMock = new AuditEventModel(AuditEventDataUpdatedModelMock);

    await TestBed.configureTestingModule({
      imports: [TransactionDataChangedComponent],
      providers: [
        {
          provide: DocumentFormService,
          useValue: {
            getDocumentFileData$: () => of(new Blob()),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionDataChangedComponent);
    component = fixture.componentInstance;
    component.fromConfiguration = new FormConfigurationModel(FormioConfigurationMock);
    component.fromConfiguration.getComponentByKey = jest.fn().mockReturnValue(mockFormComponent);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('trackByFn', async () => {
    const results = component.trackByFn(1);
    expect(results).toEqual(1);
  });

  it('should not push state updates when event is null', () => {
    component.event = undefined;
    component.ngOnInit();

    expect(component.eventUpdates.length).toBe(0);
  });

  describe('event type is transaction_data_updated', () => {
    beforeEach(() => {
      component.event = auditEventDataUpdatedModelMock;
    });

    it('should map correct form label with state changes', () => {
      component.ngOnInit();

      expect(component.eventUpdates.length).toBe(1);
      expect(component.eventUpdates[0].label).toBe('Last Name');
      expect(component.eventUpdates[0].newState).toBe('koko');
      expect(component.eventUpdates[0].oldState).toBe('joe');
    });

    it('should map null state changes to "blank"', () => {
      component.event = AuditEventDataUpdatedNullOldStateModelMock;

      component.ngOnInit();

      expect(component.eventUpdates.length).toBe(1);
      expect(component.eventUpdates[0].label).toBe('Last Name');
      expect(component.eventUpdates[0].newState).toBe('blank');
      expect(component.eventUpdates[0].oldState).toBe('blank');
    });

    it('should handle nuverialSelect component type', () => {
      component.event = AuditEventDataUpdatedNuverialSelectModelMock;

      component.ngOnInit();

      expect(component.eventUpdates.length).toBe(2);
      expect(component.eventUpdates[0].label).toBe('Industry of Employment');
      expect(component.eventUpdates[0].newState).toBe('Consulting & Strategy');
      expect(component.eventUpdates[0].oldState).toBe('blank');
    });
  });

  it('should handle nuverialFileUpload component type', () => {
    component.event = AuditEventDataUpdatedNuverialFileUploadtModelMock;

    component.ngOnInit();

    expect(component.eventUpdates.length).toBe(1);
    expect(component.eventUpdates[0].label).toBe('Proof of Income/Tax');
    expect(component.eventUpdates[0].newState).toBe('File');
    expect(component.eventUpdates[0].oldState).toBe('blank');
    expect(component.eventUpdates[0].newDocumentId).toBe('6ee8c91f-c970-486a-be42-1ac72cc803c3');
  });

  it('should handle nuverialAddress component type', () => {
    component.fromConfiguration = new FormConfigurationModel(AuditEventFormioConfigurationNuverialAddressMock);
    component.event = AuditEventDataUpdatedNuverialAddressModelMock;

    component.ngOnInit();

    expect(component.eventUpdates.length).toBe(3);

    // Appends the parent component personalInformation.currentAddress label to the result label
    expect(component.eventUpdates[0].label).toBe('Current Address - State');
    expect(component.eventUpdates[0].newState).toBe('New York');
    expect(component.eventUpdates[0].oldState).toBe('blank');

    expect(component.eventUpdates[1].label).toBe('Current Address - Country');
    expect(component.eventUpdates[1].newState).toBe('United States');
    expect(component.eventUpdates[1].oldState).toBe('blank');

    expect(component.eventUpdates[2].label).toBe('Current Address - Address Line 1');
    expect(component.eventUpdates[2].newState).toBe('42 Meaning Street');
    expect(component.eventUpdates[2].oldState).toBe('blank');
  });
});
