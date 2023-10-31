import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import {
  AuditEventDataUpdatedModelMock,
  AuditEventDocumentUnacceptedMock,
  AuditEventDocumentUnrejectedMock,
  AuditEventMock,
  AuditEventModel,
  AuditEventModelMock,
  AuditEventNoteAddedMock,
  AuditEventNoteDeletedMock,
  AuditEventNoteUpdatedMock,
  AuditEventTransactionAssignedModelMock,
  AuditEventTransactionPriorityChangedMock,
  AuditEventTransactionStatusChangedMock,
  AuditEventTransactionUnassignedModelMock,
} from '@dsg/shared/data-access/audit-api';
import { PagingResponseModel } from '@dsg/shared/data-access/http';
import { AgencyUsersMock, UserModel } from '@dsg/shared/data-access/user-api';
import { TransactionMock, TransactionModel, TransactionPrioritiesMock } from '@dsg/shared/data-access/work-api';
import { EnumerationsStateService, UserStateService } from '@dsg/shared/feature/app-state';
import { FormTransactionService } from '@dsg/shared/feature/form-nuv';
import { axe } from 'jest-axe';
import { MockProvider } from 'ng-mocks';
import { of, ReplaySubject } from 'rxjs';
import { TransactionDetailService } from '../transaction-detail/transaction-detail.service';
import { EventsLogComponent } from './events-log.component';

describe('EventsLogComponent', () => {
  let component: EventsLogComponent;
  let fixture: ComponentFixture<EventsLogComponent>;
  let pagingMetadata: PagingResponseModel;
  let auditEventDataUpdatedModelMock: AuditEventModel;
  let events: ReplaySubject<AuditEventModel[]>;
  const transactionModelMock = new TransactionModel(TransactionMock);

  const user = AgencyUsersMock.users.find(u => u.id === '111');
  const userMockModel = new UserModel(user);

  beforeEach(async () => {
    events = new ReplaySubject<AuditEventModel[]>(1);
    auditEventDataUpdatedModelMock = new AuditEventModel(AuditEventDataUpdatedModelMock);
    pagingMetadata = new PagingResponseModel({ nextPage: '1', pageNumber: 0, pageSize: 10, totalCount: 15 });
    await TestBed.configureTestingModule({
      imports: [EventsLogComponent],
      providers: [
        MockProvider(TransactionDetailService, {
          clearEvents: jest.fn().mockImplementation(),
          events$: events.asObservable(),
          eventsPagination: pagingMetadata,
          loadEvents$: jest.fn().mockImplementation(() => of([])),
        }),
        MockProvider(UserStateService, {
          getUserById$: jest.fn().mockImplementation(() => of(userMockModel)),
        }),
        MockProvider(FormTransactionService, {
          transaction$: of(new TransactionModel(transactionModelMock)),
        }),
        MockProvider(EnumerationsStateService, {
          getDataFromEnum$: jest
            .fn()
            .mockImplementationOnce(() => of(TransactionPrioritiesMock.get('LOW')))
            .mockImplementationOnce(() => of(TransactionPrioritiesMock.get('MEDIUM'))),
        }),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(EventsLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Accessability', () => {
    it('should have no violations', async () => {
      const axeResults = await axe(fixture.nativeElement);
      expect(axeResults).toHaveNoViolations();
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('trackByFn', async () => {
    const results = component.trackByFn(1);
    expect(results).toEqual(1);
  });

  describe('eventsDetails', () => {
    let transactionDetailService: TransactionDetailService;
    beforeEach(async () => {
      transactionDetailService = TestBed.inject(TransactionDetailService);
    });

    it('should call loadEvents$', fakeAsync(() => {
      const spy = jest.spyOn(transactionDetailService, 'loadEvents$').mockReturnValue(of([AuditEventModelMock]));
      events.next([AuditEventModelMock]);

      tick();
      expect(spy).toHaveBeenCalled();
    }));
  });

  it('should call getEvents on ngOnInit', () => {
    const spy = jest.spyOn(component, 'getEvents$');
    component.ngOnInit();
    expect(spy).toHaveBeenCalled();
  });

  describe('loadMoreEvents', () => {
    it('should call getEvents when events size is less than totalEventsCount', () => {
      const getEventsSpy = jest.spyOn(component, 'getEvents$');
      component.loadMoreEvents();
      expect(getEventsSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleEventTitle', () => {
    let auditEventModelMock: AuditEventModel;

    it('should map correct summary based on type - transaction_created', () => {
      auditEventModelMock = new AuditEventModel(AuditEventMock);
      component['_handleEventTitle'](auditEventModelMock);
      expect(auditEventModelMock.summary).toBe('Application created');
    });

    it('should map correct summary based on type - transaction_data_updated', () => {
      auditEventModelMock = new AuditEventModel(auditEventDataUpdatedModelMock);

      component['_handleEventTitle'](auditEventModelMock);
      expect(auditEventModelMock.summary).toBe('Application edited');
    });

    it('should map correct summary based on type - transaction_assigned_to_changed - assign', fakeAsync(() => {
      auditEventModelMock = new AuditEventModel(AuditEventTransactionAssignedModelMock);
      auditEventModelMock.displayName = 'Gellar Bing';

      const user2 = AgencyUsersMock.users.find(u => u.id === '222');
      const userStateService = TestBed.inject(UserStateService);
      userStateService.getUserDisplayName$ = jest
        .fn()
        .mockImplementationOnce(() => of('Gellar Bing'))
        .mockImplementationOnce(() => of(user2?.displayName));

      component['_handleEventTitle'](auditEventModelMock);

      tick();
      expect(auditEventModelMock.summary).toBe('Gellar Bing assigned this application to Chandler M Bing');
    }));

    it('should map correct summary based on type - transaction_assigned_to_changed - unassign', fakeAsync(() => {
      auditEventModelMock = new AuditEventModel(AuditEventTransactionUnassignedModelMock);
      auditEventModelMock.displayName = 'Gellar Bing';

      const user2 = AgencyUsersMock.users.find(u => u.id === auditEventModelMock.eventData.newState);
      const userStateService = TestBed.inject(UserStateService);
      userStateService.getUserDisplayName$ = jest
        .fn()
        .mockImplementationOnce(() => of('Gellar Bing'))
        .mockImplementationOnce(() => of(user2?.displayName));

      component['_handleEventTitle'](auditEventModelMock);

      tick();
      expect(auditEventModelMock.summary).toBe('Gellar Bing unassigned this application');
    }));

    it('should map correct summary based on type - note_added', () => {
      auditEventModelMock = new AuditEventModel(AuditEventNoteAddedMock);

      component['_handleEventTitle'](auditEventModelMock);
      expect(auditEventModelMock.summary).toBe('Note added');
    });

    it('should map correct summary based on type - note_deleted', () => {
      auditEventModelMock = new AuditEventModel(AuditEventNoteDeletedMock);

      component['_handleEventTitle'](auditEventModelMock);
      expect(auditEventModelMock.summary).toBe('Note deleted');
    });

    it('should map correct summary based on type - note_updated', () => {
      auditEventModelMock = new AuditEventModel(AuditEventNoteUpdatedMock);

      component['_handleEventTitle'](auditEventModelMock);
      expect(auditEventModelMock.summary).toBe('Note edited');
    });

    it('should map correct summary based on type - transaction_status_changed', () => {
      auditEventModelMock = new AuditEventModel(AuditEventTransactionStatusChangedMock);
      component['_handleEventTitle'](auditEventModelMock);
      expect(auditEventModelMock.summary).toBe('Application status changed from Draft to Review');
    });

    it('should map correct summary based on type - transaction_priority_changed', async () => {
      auditEventModelMock = new AuditEventModel(AuditEventTransactionPriorityChangedMock);
      await component['_handleEventTitle'](auditEventModelMock);
      expect(auditEventModelMock.summary).toBe(`Application priority changed from <span class="title-priority low">
      <span class="material-icons priority-icon">remove</span>Low</span> to <span class="title-priority medium">
      <span class="material-icons priority-icon">drag_handle</span>Medium</span>`);
    });

    it('should map correct summary based on type - transaction_priority_changed - missing changed values', async () => {
      auditEventModelMock = new AuditEventModel(AuditEventTransactionPriorityChangedMock);
      auditEventModelMock.eventData.oldState = undefined;
      auditEventModelMock.eventData.newState = undefined;
      await component['_handleEventTitle'](auditEventModelMock);
      expect(auditEventModelMock.summary).toBe(`Application priority changed (Missing changed values)`);
    });

    it('should map correct summary based on type - transaction_priority_changed - unexpected change data', async () => {
      auditEventModelMock = new AuditEventModel(AuditEventTransactionPriorityChangedMock);
      auditEventModelMock.eventData.oldState = 'unexpectedData';
      auditEventModelMock.eventData.newState = 'unexpectedData';
      await component['_handleEventTitle'](auditEventModelMock);
      expect(auditEventModelMock.summary).toBe(`Application priority changed (Unable to render changed values)`);
    });

    it('should map correct summary based on type - document_unaccepted', () => {
      auditEventModelMock = new AuditEventModel(AuditEventDocumentUnacceptedMock);
      component['_handleEventTitle'](auditEventModelMock);
      expect(auditEventModelMock.summary).toBe('Document reset back to New from Accepted');
    });

    it('should map correct summary based on type - document_unrejected', () => {
      auditEventModelMock = new AuditEventModel(AuditEventDocumentUnrejectedMock);
      component['_handleEventTitle'](auditEventModelMock);
      expect(auditEventModelMock.summary).toBe('Document reset back to New from Rejected');
    });
  });
});
