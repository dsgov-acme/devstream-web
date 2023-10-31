/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditEventDocumentRejectedMock, AuditEventModel } from '@dsg/shared/data-access/audit-api';
import { DocumentRejectionReasonsMock, FormConfigurationModel, FormioConfigurationTestMock } from '@dsg/shared/data-access/work-api';
import { EnumerationsStateService } from '@dsg/shared/feature/app-state';
import { DocumentFormService } from '@dsg/shared/feature/form-nuv';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { DocumentStatusChangedComponent } from './document-status-changed.component';

describe('DocumentStatusChangedComponent', () => {
  let component: DocumentStatusChangedComponent;
  let fixture: ComponentFixture<DocumentStatusChangedComponent>;
  let auditEventDocumentStatusChangedModelMock: AuditEventModel;

  const mockFormComponent = {
    key: 'personalInformation.document',
    props: {
      label: 'document',
    },
  };

  beforeEach(async () => {
    auditEventDocumentStatusChangedModelMock = new AuditEventModel(AuditEventDocumentRejectedMock);

    await TestBed.configureTestingModule({
      imports: [DocumentStatusChangedComponent],
      providers: [
        {
          provide: DocumentFormService,
          useValue: {
            getDocumentFileData$: () => of(new Blob()),
          },
        },
        MockProvider(EnumerationsStateService, {
          getEnumMap$: jest.fn().mockReturnValue(of(DocumentRejectionReasonsMock)),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentStatusChangedComponent);
    component = fixture.componentInstance;
    component.fromConfiguration = new FormConfigurationModel(FormioConfigurationTestMock);
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

  describe('event type is document_rejected', () => {
    beforeEach(() => {
      component.event = auditEventDocumentStatusChangedModelMock;
    });

    it('should map correct form label with document name and rejected reasons', () => {
      component.ngOnInit();

      expect(component.documentName).toBeTruthy();
      expect(component.documentName).toEqual('document');
      expect(component.rejectedReasons.length).toBe(2);
      expect(component.rejectedReasons[0]).toEqual('Poor Quality');
      expect(component.rejectedReasons[1]).toEqual('Incorrect Type');
    });
  });
});
