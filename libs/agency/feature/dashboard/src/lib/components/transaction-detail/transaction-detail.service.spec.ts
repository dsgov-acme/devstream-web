import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { AuditEventModelMock, AuditEventsSchemaMock, AuditRoutesService } from '@dsg/shared/data-access/audit-api';
import {
  DocumentApiRoutesService,
  IAntivirusScannerResult,
  IDocumentQualityResult,
  IIdProofingResult,
  PROCESSING_RESULT_ID,
  ProcessingResultsMock,
} from '@dsg/shared/data-access/document-api';
import { PagingRequestModel, PagingResponseModel } from '@dsg/shared/data-access/http';
import { AgencyUsersMock, UserApiRoutesService, UserMock, UserModel } from '@dsg/shared/data-access/user-api';
import {
  CustomerProvidedDocumentMock,
  CustomerProvidedDocumentMock2,
  CustomerProvidedDocumentMock3,
  DocumentRejectionReasonsMock,
  FormConfigurationModel,
  FormModel,
  FormioConfigurationTestMock,
  ICustomerProvidedDocument,
  INotesPaginationResponse,
  NoteMock,
  NoteModel,
  TransactionMock,
  TransactionMockWithDocuments,
  TransactionModel,
  WorkApiRoutesService,
} from '@dsg/shared/data-access/work-api';
import { EnumerationsStateService, UserStateService } from '@dsg/shared/feature/app-state';
import { FormTransactionService } from '@dsg/shared/feature/form-nuv';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { MockProvider, ngMocks } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { TransactionDetailService } from './transaction-detail.service';

const userModelMock = new UserModel(UserMock);
const noteModelMock = new NoteModel(NoteMock);

describe('TransactionDetailService', () => {
  let service: TransactionDetailService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(HttpClient),
        MockProvider(NuverialSnackBarService),
        MockProvider(DocumentApiRoutesService, {
          getDocumentFileData$: jest.fn().mockImplementation(() => of('123')),
          getProcessingResults$: jest.fn().mockReturnValue(of(ProcessingResultsMock)),
        }),
        MockProvider(UserApiRoutesService, {
          getUserById$: jest.fn().mockImplementation(() => of(userModelMock)),
          getUsers$: jest.fn().mockImplementation(() => of(AgencyUsersMock)),
        }),
        MockProvider(UserStateService, {
          getUserById$: jest.fn().mockImplementation(() => of(userModelMock)),
          getUserDisplayName$: jest.fn().mockImplementation(() => of('')),
        }),
        MockProvider(AuditRoutesService, {
          getEvents$: jest.fn().mockImplementation(() => of(AuditEventsSchemaMock)),
        }),
        MockProvider(WorkApiRoutesService, {
          createNote$: jest.fn().mockReturnValue(of(noteModelMock)),
          deleteNote$: jest.fn().mockReturnValue(of(undefined)),
          getNote$: jest.fn().mockReturnValue(of(noteModelMock)),
          updateNote$: jest.fn().mockReturnValue(of(noteModelMock)),
          updateTransactionById$: jest.fn().mockImplementation(() => of(new TransactionModel(TransactionMock))),
          updateTransactionDocumentsById$: jest.fn().mockImplementation(() => of(CustomerProvidedDocumentMock)),
        }),
        MockProvider(EnumerationsStateService, {
          getEnumMap$: jest.fn().mockReturnValue(of(DocumentRejectionReasonsMock)),
        }),
        MockProvider(FormTransactionService, {
          formConfiguration: new FormConfigurationModel(FormioConfigurationTestMock),
          loadTransactionDetails$: jest.fn().mockImplementation(() => of([{}, new TransactionModel(TransactionMockWithDocuments)])),
          transaction: new TransactionModel(TransactionMockWithDocuments),
          transaction$: of(new TransactionModel(TransactionMockWithDocuments)),
          transactionId: 'testId',
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'transactionId' }),
            snapshot: {
              paramMap: {
                get: () => 'mockValue',
              },
              params: { transactionId: 'mockValue' },
            },
          },
        },
      ],
    });
    service = TestBed.inject(TransactionDetailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get transaction id', () => {
    expect(service.transactionId).toEqual('testId');
  });

  describe('initialize$', () => {
    it('should call loadTransactionDetails$ with transactionId', () => {
      const formTransactionService = ngMocks.findInstance(FormTransactionService);
      const loadTransactionDetails$Spy = jest.spyOn(formTransactionService, 'loadTransactionDetails$');
      service.initialize$('testId').subscribe();
      expect(loadTransactionDetails$Spy).toHaveBeenCalledWith('testId');
    });

    it('should call the getProcessingResults$ api', () => {
      const documentApiRoutesService = ngMocks.findInstance(DocumentApiRoutesService);
      const getProcessingResults$Spy = jest.spyOn(documentApiRoutesService, 'getProcessingResults$');
      service.initialize$('testId').subscribe();
      expect(getProcessingResults$Spy).toHaveBeenCalledTimes(3);
    });

    it('should receive processingResults back from a document', async () => {
      service.getProcessingResults$(CustomerProvidedDocumentMock.id).subscribe(results => {
        expect(results).toBeTruthy();
      });
    });

    it('should set the overall document.shouldDisplayErrors to true if any processingResult has an error', async () => {
      service.getProcessingResults$(CustomerProvidedDocumentMock.id).subscribe(_ => {
        expect(CustomerProvidedDocumentMock.shouldDisplayErrors).toEqual(true);
      });
    });

    it('should display an error if document id proofing processing result does not have an allPass', async () => {
      service.getProcessingResults$(CustomerProvidedDocumentMock.id).subscribe(results => {
        const idProofingResult = results.find(x => x.processorId === PROCESSING_RESULT_ID.idProofing)?.result as IIdProofingResult;
        expect(idProofingResult.shouldDisplayError).toEqual(true);
      });
    });

    it('should not display any evidence signals in the id proofing processing results', async () => {
      service.getProcessingResults$(CustomerProvidedDocumentMock.id).subscribe(results => {
        const idProofingResult = results.find(x => x.processorId === PROCESSING_RESULT_ID.idProofing)?.result as IIdProofingResult;
        expect(idProofingResult.signals.filter(s => s.name.includes('evidence'))).toEqual(false);
      });
    });

    it('should display an error if antivirus scanning processing result has a code other than 200', async () => {
      service.getProcessingResults$(CustomerProvidedDocumentMock.id).subscribe(results => {
        const antivirusResult = results.find(x => x.processorId === PROCESSING_RESULT_ID.antivirus)?.result as IAntivirusScannerResult;
        expect(antivirusResult.shouldDisplayError).toEqual(true);
      });
    });

    it('should display an error if document quality processing result quality score is less than 0.01', done => {
      service.getProcessingResults$(CustomerProvidedDocumentMock.id).subscribe(results => {
        const docQualityResult = results.find(x => x.processorId === PROCESSING_RESULT_ID.docQuality)?.result as IDocumentQualityResult;
        expect(docQualityResult.shouldDisplayError).toEqual(true);
        done();
      });
    });

    it('should not call getProcessingResults if no documents', () => {
      const documentApiRoutesService = ngMocks.findInstance(DocumentApiRoutesService);
      const getProcessingResults$Spy = jest.spyOn(documentApiRoutesService, 'getProcessingResults$');
      const formTransactionService = ngMocks.findInstance(FormTransactionService);
      const loadTransactionDetails$Spy = jest
        .spyOn(formTransactionService, 'loadTransactionDetails$')
        .mockImplementation(_ => of([new FormModel(), new TransactionModel(TransactionMock)]));
      service.initialize$('testId').subscribe();
      expect(loadTransactionDetails$Spy).toHaveBeenCalledWith('testId');
      expect(getProcessingResults$Spy).not.toHaveBeenCalled();
    });

    it('should handle error loading processingResults$', async () => {
      const documentApiRoutesService = ngMocks.findInstance(DocumentApiRoutesService);
      jest.spyOn(documentApiRoutesService, 'getProcessingResults$').mockImplementation(() => throwError(() => new Error('an error')));
      service.initialize$('testId').subscribe(results => {
        expect(results).toEqual([]);
      });
    });

    it('should call loadAssignedAgent$ and loadUser$ functions', () => {
      const loadAssignedAgent$Spy = jest.spyOn(service, 'loadAssignedAgent$');
      const loadUser$Spy = jest.spyOn(service, 'loadUser$');
      service.initialize$('testId').subscribe();
      expect(loadAssignedAgent$Spy).toHaveBeenCalledTimes(1);
      expect(loadUser$Spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('_getUser$', () => {
    it('should get a userModel', done => {
      const userApiService = ngMocks.findInstance(UserApiRoutesService);
      const getUserById$Spy = jest.spyOn(userApiService, 'getUserById$');
      const _userSpy = jest.spyOn(service['_user'], 'next');

      service['_getUserById$']('testId').subscribe(userModel => {
        expect(userModel).toEqual(userModelMock);
        expect(getUserById$Spy).toHaveBeenCalledWith('testId');
        expect(_userSpy).toBeCalledWith(userModelMock);

        done();
      });
    });
  });

  describe('_getEvents$', () => {
    it('should get the eventsModel and pagingResponseModel for events', done => {
      const auditRoutesService = ngMocks.findInstance(AuditRoutesService);
      const getEvents$Spy = jest.spyOn(auditRoutesService, 'getEvents$');
      const _eventsSpy = jest.spyOn(service['_events'], 'next');
      const _eventsPaginationSpy = jest.spyOn(service['_eventsPagination'], 'next');

      const pagingRequestModel: PagingRequestModel = new PagingRequestModel();

      service['_getEvents$']('123', 'transaction', pagingRequestModel).subscribe(events => {
        expect(events).toEqual([AuditEventModelMock]);
        expect(getEvents$Spy).toHaveBeenCalledWith({ businessObjectType: 'transaction', pagingRequestModel, transactionId: '123' });
        expect(_eventsSpy).toBeCalledWith(AuditEventsSchemaMock.events);
        expect(_eventsPaginationSpy).toBeCalledWith(AuditEventsSchemaMock.pagingMetadata);

        expect(service.eventsPagination).toEqual(service['_eventsPagination'].value);
        done();
      });
    });

    it('should have events display name as empty when user not found', done => {
      const userStateService = TestBed.inject(UserStateService);

      jest.spyOn(userStateService, 'getUserById$').mockReturnValue(of(undefined));

      const pagingRequestModel: PagingRequestModel = new PagingRequestModel();

      service['_getEvents$']('123', 'transaction', pagingRequestModel).subscribe(events => {
        expect(events[0].displayName).toEqual('');
        done();
      });
    });
  });

  describe('loadUserDetails$', () => {
    it('should load user details', done => {
      service.loadUser$('testId').subscribe();

      service.user$.subscribe(userModel => {
        expect(userModel).toEqual(userModelMock);

        done();
      });
    });
  });

  describe('loadEvents', () => {
    it('should load user details', done => {
      service.loadEvents$('testid', 'transaction').subscribe();

      service.events$.subscribe(eventsModel => {
        expect(eventsModel).toEqual(AuditEventsSchemaMock.events);

        done();
      });
    });
  });

  describe('getDocumentRejectionReasons', () => {
    it('should get the document rejection reasons', done => {
      service.getDocumentRejectionReasons$().subscribe(reasons => {
        expect(4).toEqual(reasons.size);
        expect('Incorrect Type').toEqual(reasons.get('INCORRECT_TYPE')?.label);
        done();
      });
    });
  });

  describe('getProcessingResults', () => {
    it('should get the document processing results', done => {
      const documentService = ngMocks.findInstance(DocumentApiRoutesService);
      documentService.getProcessingResults$('6d0b34d5-7951-4775-87c5-a198ed3e9f01').subscribe(reasons => {
        expect(reasons.length).toEqual(ProcessingResultsMock.length);
        done();
      });
    });
  });

  describe('customerProvidedDocument', () => {
    it('should store mapped documents from the transaction to the behavior subject', done => {
      const _customerProvidedDocumentsSpy = jest.spyOn(service['_customerProvidedDocuments'], 'next');
      const _mapDocumentForRenderingSpy = jest.spyOn(service as any, '_mapDocumentForRendering');
      const formTransactionService = TestBed.inject(FormTransactionService);

      service.storeCustomerDocuments$().subscribe(_ => {
        expect(_customerProvidedDocumentsSpy).toHaveBeenCalled();
        expect(_mapDocumentForRenderingSpy).toHaveBeenCalledTimes(formTransactionService.transaction.customerProvidedDocuments?.length || -1);
        done();
      });
    });

    it('should return EMPTY if transaction is not defined', () => {
      const _customerProvidedDocumentsSpy = jest.spyOn(service['_customerProvidedDocuments'], 'next');
      const _mapDocumentForRenderingSpy = jest.spyOn(service as any, '_mapDocumentForRendering');
      const formTransactionService = TestBed.inject(FormTransactionService);
      Object.defineProperty(formTransactionService, 'transaction', {
        get: () => new TransactionModel(),
      });

      service.storeCustomerDocuments$().subscribe();
      expect(_customerProvidedDocumentsSpy).not.toHaveBeenCalled();
      expect(_mapDocumentForRenderingSpy).not.toHaveBeenCalled();
    });

    it('should return _customerProvidedDocuments if it exists', () => {
      const _customerProvidedDocumentsSpy = jest.spyOn(service['_customerProvidedDocuments'], 'next');
      const _mapDocumentForRenderingSpy = jest.spyOn(service as any, '_mapDocumentForRendering');
      TestBed.inject(FormTransactionService);
      service['_customerProvidedDocuments'].next([CustomerProvidedDocumentMock]);

      service.storeCustomerDocuments$().subscribe(documents => {
        expect(documents).toEqual([CustomerProvidedDocumentMock]);
        expect(_customerProvidedDocumentsSpy).not.toHaveBeenCalled();
        expect(_mapDocumentForRenderingSpy).not.toHaveBeenCalled();
      });
    });

    it('should sort documents as they are in the form configuration', done => {
      service['_customerProvidedDocuments'].next([...service['_customerProvidedDocuments'].getValue(), CustomerProvidedDocumentMock]);
      service['_customerProvidedDocuments'].next([...service['_customerProvidedDocuments'].getValue(), CustomerProvidedDocumentMock2]);
      service['_customerProvidedDocuments'].next([...service['_customerProvidedDocuments'].getValue(), CustomerProvidedDocumentMock3]);

      service.customerProvidedDocuments$.subscribe((documents: ICustomerProvidedDocument[]) => {
        expect(documents.length).toEqual(3);

        expect(documents[0].id).toEqual(CustomerProvidedDocumentMock3.id);
        expect(documents[1].id).toEqual(CustomerProvidedDocumentMock.id);
        expect(documents[2].id).toEqual(CustomerProvidedDocumentMock2.id);
        done();
      });
    });

    it('should load document', done => {
      service
        .updateCustomerProvidedDocument(TransactionMock.id, CustomerProvidedDocumentMock.id, {
          ...CustomerProvidedDocumentMock,
          rejectionReasons: undefined,
          reviewStatus: 'ACCEPTED',
        })
        .subscribe(document => {
          expect(document.reviewStatus).toEqual('ACCEPTED');
          done();
        });
    });

    it('should map the document for rendering', async () => {
      const userStateService = TestBed.inject(UserStateService);

      userStateService.getUserDisplayName$ = jest.fn().mockImplementationOnce(() => of('Chandler Muriel Bing'));

      const mappedDocument = await service['_mapDocumentForRendering'](CustomerProvidedDocumentMock);

      expect(mappedDocument.label).toEqual('Photo ID - Back of ID');
      expect(mappedDocument.reviewedByDisplayName).toEqual('Chandler Muriel Bing');
    });
  });

  it('should call createNote from workApiRoutesService when creating a new note', () => {
    const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
    const spy = jest.spyOn(workApiRoutesService, 'createNote$').mockReturnValue(of());

    service.createNote$('123', noteModelMock);
    expect(spy).toHaveBeenCalledWith('123', noteModelMock);
  });

  it('should call getProcessingResults from _documentApiRoutesService when getProcessingResults is called', () => {
    const documentApiRoutesService = TestBed.inject(DocumentApiRoutesService);
    const spy = jest.spyOn(documentApiRoutesService, 'getProcessingResults$').mockReturnValue(of());

    service.getProcessingResults$('123');
    expect(spy).toHaveBeenCalledWith('123');
  });

  describe('loadNotes$', () => {
    it('should load notes and update the internal subjects', done => {
      const notesResponse: INotesPaginationResponse<NoteModel> = {
        items: [noteModelMock],
        pagingMetadata: new PagingResponseModel(),
      };
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      jest.spyOn(workApiRoutesService, 'getNotes$').mockReturnValue(of(notesResponse));
      const _notesSpy = jest.spyOn(service['_notes'], 'next');
      const _notesPaginationSpy = jest.spyOn(service['_notesPagination'], 'next');

      service.loadNotes$('testTransactionId').subscribe(() => {
        expect(_notesSpy).toHaveBeenCalledWith(notesResponse.items);
        expect(_notesPaginationSpy).toHaveBeenCalledWith(notesResponse.pagingMetadata);
        expect(service.notesPagination).toEqual(service['_notesPagination'].value);
        done();
      });
    });
  });

  it('should cleanup service state', () => {
    jest.spyOn(service['_user'], 'next');

    service.cleanUp();

    expect(service['_user'].next).toHaveBeenCalledWith(new UserModel());
  });

  describe('deleteNotes$', () => {
    it('shoud call deleteNote$ from workApiRoutesService on success', done => {
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);

      service.deleteNote$(TransactionMock.id, '123').subscribe(_ => {
        expect(workApiRoutesService.deleteNote$).toHaveBeenCalled;
        done();
      });
    });

    it('should call NuverialSnackBarService on error', () => {
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      const nuverialSnackBarService = TestBed.inject(NuverialSnackBarService);

      jest.spyOn(workApiRoutesService, 'deleteNote$').mockImplementation(() => throwError(() => new Error('an error')));
      const spyNotifyApplicationError = jest.spyOn(nuverialSnackBarService, 'notifyApplicationError');
      service.deleteNote$(TransactionMock.id, '123').subscribe();
      expect(spyNotifyApplicationError).toHaveBeenCalled();
    });
  });

  describe('updateTransactionPriority', () => {
    it('should update the transaction', done => {
      const workApiService = ngMocks.findInstance(WorkApiRoutesService);
      const getTransactionById$Spy = jest.spyOn(workApiService, 'updateTransactionById$');

      const transactionModelMock = new TransactionModel(TransactionMock);

      service.updateTransactionPriority$('high').subscribe(transactionModel => {
        expect(transactionModel).toEqual(transactionModelMock);
        expect(getTransactionById$Spy).toHaveBeenCalledWith({
          transaction: transactionModelMock.toPrioritySchema(),
          transactionId: 'testId',
        });

        done();
      });
    });
  });

  it('should load the user response from _getUserById to the _user replay subject', done => {
    const userApiService = ngMocks.findInstance(UserApiRoutesService);
    const getUserById$Spy = jest.spyOn(userApiService, 'getUserById$');
    const _userSpy = jest.spyOn(service['_user'], 'next');

    service['_getUserById$']('testId').subscribe(userModel => {
      expect(userModel).toEqual(userModelMock);
      expect(getUserById$Spy).toHaveBeenCalledWith('testId');
      expect(_userSpy).toBeCalledWith(userModelMock);

      done();
    });
  });

  it('should load the assigned agent to _agents subject when loadAssignedAgent$ is called and the assigned agent was not present in _agents', done => {
    const userId = 'testUserId';
    const userStateService = ngMocks.findInstance(UserStateService);

    const getUserById$Spy = jest.spyOn(userStateService, 'getUserById$');
    const _agentsNextSpy = jest.spyOn(service['_agents'], 'next');

    service.loadAssignedAgent$(userId).subscribe(() => {
      expect(getUserById$Spy).toHaveBeenCalledWith(userId);
      expect(_agentsNextSpy).toHaveBeenCalledWith([userModelMock]);
      done();
    });
  });

  it('should load agency users to _agents when loadAgencyUsers$ is called', done => {
    const userApiService = ngMocks.findInstance(UserApiRoutesService);
    const getUsers$Spy = jest.spyOn(userApiService, 'getUsers$');

    const _agentsPaginationNextSpy = jest.spyOn(service['_agentsPagination'], 'next');
    const _agentsNextSpy = jest.spyOn(service['_agents'], 'next');

    service.loadAgencyUsers$().subscribe(() => {
      expect(getUsers$Spy).toHaveBeenCalledWith([{ field: 'userType', value: 'agency' }], undefined);
      expect(_agentsPaginationNextSpy).toHaveBeenCalled();
      expect(_agentsNextSpy).toHaveBeenCalledWith(AgencyUsersMock.users.sort((a, b) => a.displayName.localeCompare(b.displayName)));
      done();
    });
  });

  describe('updateTransactionAssignedTo', () => {
    it('should update the transaction', done => {
      const workApiService = ngMocks.findInstance(WorkApiRoutesService);
      const getTransactionById$Spy = jest.spyOn(workApiService, 'updateTransactionById$');
      const transactionModelMock = new TransactionModel(TransactionMock);

      service.updateTransactionAssignedTo$('agent').subscribe(transactionModel => {
        expect(transactionModel).toEqual(transactionModelMock);
        expect(getTransactionById$Spy).toHaveBeenCalledWith({
          transaction: transactionModelMock.toAssignedToSchema(),
          transactionId: 'testId',
        });

        done();
      });
    });
  });

  describe('review transaction', () => {
    it('should call updateTransactionById$ with the correct parameters and update transaction in formTransactionService', () => {
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      const formTransactionService = TestBed.inject(FormTransactionService);

      jest.spyOn(workApiRoutesService, 'updateTransactionById$').mockReturnValue(of(new TransactionModel()));

      Object.defineProperty(formTransactionService, 'transaction', {
        get: () => formTransactionService.transaction,
        set: value => {
          formTransactionService.transaction = value;
        },
      });

      const spyTransactionSetter = jest.spyOn(formTransactionService, 'transaction', 'set');

      service.reviewTransaction$('testAction', 'testTaskId').subscribe();
      expect(workApiRoutesService.updateTransactionById$).toHaveBeenCalledWith({
        completeTask: true,
        taskId: 'testTaskId',
        transaction: new TransactionModel().toActionSchema('testAction'),
        transactionId: 'testId',
      });
      expect(spyTransactionSetter).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear events', () => {
      const _eventsSpy = jest.spyOn(service['_events'], 'next');
      service.clearEvents();
      expect(_eventsSpy).toBeCalledWith([]);
    });

    it('should clear notes', () => {
      const _notesSpy = jest.spyOn(service['_notes'], 'next');
      service.clearNotes();
      expect(_notesSpy).toBeCalledWith([]);
    });

    it('should clear customer provided documents', () => {
      const _customerProvidedDocumentsSpy = jest.spyOn(service['_customerProvidedDocuments'], 'next');
      service.clearCustomerProvidedDocuments();
      expect(_customerProvidedDocumentsSpy).toBeCalledWith([]);
    });
  });

  describe('notes', () => {
    it('should get notes', () => {
      const note = [new NoteModel(NoteMock)];
      service['_notes'].next(note);
      expect(service.notes).toEqual(note);
    });
    it('should call get note by id', () => {
      const workApiRoutesService = ngMocks.findInstance(WorkApiRoutesService);
      const getNote$Spy = jest.spyOn(workApiRoutesService, 'getNote$');
      service.getNoteById$('123', '456').subscribe();
      expect(getNote$Spy).toBeCalledWith('123', '456');
    });

    it('should edit note', () => {
      const workApiRoutesService = ngMocks.findInstance(WorkApiRoutesService);
      const updateNote$Spy = jest.spyOn(workApiRoutesService, 'updateNote$');
      service.editNote$('123', '456', new NoteModel()).subscribe();
      expect(updateNote$Spy).toBeCalledWith('123', '456', new NoteModel());
    });
  });
});
