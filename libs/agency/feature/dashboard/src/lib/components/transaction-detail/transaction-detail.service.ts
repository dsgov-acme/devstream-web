import { Injectable } from '@angular/core';
import { AuditEventModel, AuditRoutesService, IEventsPaginationResponse } from '@dsg/shared/data-access/audit-api';
import { DocumentApiRoutesService, IProcessingResultSchema, checkIfDocumentShouldDisplayErrors } from '@dsg/shared/data-access/document-api';
import { Filter, PagingRequestModel, PagingResponseModel } from '@dsg/shared/data-access/http';
import { UserApiRoutesService, UserModel } from '@dsg/shared/data-access/user-api';
import {
  EnumMapType,
  ICustomerProvidedDocument,
  IEnumData,
  ITransactionActiveTask,
  NoteModel,
  TransactionModel,
  UpdateTransactionOptions,
  WorkApiRoutesService,
} from '@dsg/shared/data-access/work-api';
import { EnumerationsStateService, UserStateService } from '@dsg/shared/feature/app-state';
import { FormTransactionService } from '@dsg/shared/feature/form-nuv';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  ReplaySubject,
  catchError,
  concatMap,
  firstValueFrom,
  forkJoin,
  from,
  map,
  of,
  switchMap,
  take,
  tap,
  toArray,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TransactionDetailService {
  private readonly _user: ReplaySubject<UserModel> = new ReplaySubject<UserModel>(1);
  private readonly _events: ReplaySubject<AuditEventModel[]> = new ReplaySubject<AuditEventModel[]>(1);
  private readonly _eventsPagination: BehaviorSubject<PagingResponseModel> = new BehaviorSubject<PagingResponseModel>(new PagingResponseModel());
  private readonly _notes: BehaviorSubject<NoteModel[]> = new BehaviorSubject<NoteModel[]>([]);
  private readonly _notesPagination: BehaviorSubject<PagingResponseModel> = new BehaviorSubject<PagingResponseModel>(new PagingResponseModel());
  private readonly _customerProvidedDocuments: BehaviorSubject<ICustomerProvidedDocument[]> = new BehaviorSubject<ICustomerProvidedDocument[]>([]);
  private readonly _agents: BehaviorSubject<UserModel[]> = new BehaviorSubject<UserModel[]>([]);
  private readonly _agentsPagination: BehaviorSubject<PagingResponseModel> = new BehaviorSubject<PagingResponseModel>(new PagingResponseModel());

  public user$: Observable<UserModel> = this._user.asObservable();
  public events$: Observable<AuditEventModel[]> = this._events.asObservable();
  public eventsPagination$: Observable<PagingResponseModel> = this._eventsPagination.asObservable();
  public notes$: Observable<NoteModel[]> = this._notes.asObservable();
  public notesPagination$: Observable<PagingResponseModel> = this._notesPagination.asObservable();
  public transactionActiveTask$: Observable<ITransactionActiveTask | undefined> = this._formTransactionService.transaction$.pipe(
    // We currently assume that there can be a maximum of one active task
    map(transaction => (transaction.activeTasks.length > 0 ? transaction.activeTasks[0] : undefined)),
  );

  public customerProvidedDocuments$: Observable<ICustomerProvidedDocument[]> = this._customerProvidedDocuments.asObservable().pipe(
    map(documents => {
      //sort documents as they are in the form configuration
      const docKeys = documents.map(document => document.dataPath);
      const sortedDocKeys = this._formTransactionService.formConfiguration.findComponentsKeyInOrder(docKeys);

      const keyToDocumentMap: Map<string, ICustomerProvidedDocument> = new Map();
      documents.forEach(document => {
        keyToDocumentMap.set(document.dataPath, document);
      });

      return sortedDocKeys.map(key => keyToDocumentMap.get(key)).filter(doc => !!doc) as ICustomerProvidedDocument[];
    }),
  );
  public agents$: Observable<UserModel[]> = this._agents.asObservable();
  public agentsPagination$: Observable<PagingResponseModel> = this._agentsPagination.asObservable();

  /**
   * Get the transaction user
   */

  private _getUserById$(userId: string): Observable<UserModel> {
    return this._userApiRoutesService.getUserById$(userId).pipe(tap(userModel => this._user.next(userModel)));
  }

  private _getEvents$(transactionId: string, businessObjectType: string, pagingRequestModel?: PagingRequestModel): Observable<AuditEventModel[]> {
    return this._auditRoutesService.getEvents$({ businessObjectType, pagingRequestModel, transactionId }).pipe(
      tap(eventsPaginationResp => {
        this._eventsPagination.next(eventsPaginationResp.pagingMetadata);
      }),
      switchMap(async (eventsPaginationResp: IEventsPaginationResponse<AuditEventModel>) => {
        for (const event of eventsPaginationResp.events) {
          event.displayName = await firstValueFrom(this._userStateService.getUserDisplayName$(event.requestContext?.userId || ''));
        }

        return eventsPaginationResp.events;
      }),
      tap(events => this._events.next(events)),
    );
  }

  private _getNotes$(transactionId: string, pagingRequestModel?: PagingRequestModel): Observable<NoteModel[]> {
    return this._workApiRoutesService.getNotes$(transactionId, pagingRequestModel).pipe(
      tap(notesPaginationResp => this._notesPagination.next(notesPaginationResp.pagingMetadata)),
      switchMap(notesPaginationResp =>
        from(notesPaginationResp.items).pipe(
          concatMap(async note => {
            note.lastCreatedByDisplayName = await firstValueFrom(this._userStateService.getUserDisplayName$(note.createdBy));
            note.lastUpdatedByDisplayName = await firstValueFrom(this._userStateService.getUserDisplayName$(note.lastUpdatedBy));

            return note;
          }),
          toArray(),
        ),
      ),
      tap(notes => {
        this._notes.next([...this._notes.value, ...notes]);
      }),
    );
  }

  public get transactionId(): string {
    return this._formTransactionService.transactionId;
  }

  public get eventsPagination(): PagingResponseModel {
    return this._eventsPagination.value;
  }

  public get notesPagination(): PagingResponseModel {
    return this._notesPagination.value;
  }

  public get notes(): NoteModel[] {
    return this._notes.value;
  }

  constructor(
    private readonly _documentApiRoutesService: DocumentApiRoutesService,
    private readonly _workApiRoutesService: WorkApiRoutesService,
    private readonly _userApiRoutesService: UserApiRoutesService,
    private readonly _auditRoutesService: AuditRoutesService,
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
    public workApiRoutesService: WorkApiRoutesService,
    private readonly _userStateService: UserStateService,
    private readonly _formTransactionService: FormTransactionService,
    private readonly _enumerationsStateService: EnumerationsStateService,
  ) {}

  public initialize$(transactionId: string) {
    return this._formTransactionService.loadTransactionDetails$(transactionId).pipe(
      switchMap(([_, transactionModel]) => {
        const transactionDetailsRequests: Array<Observable<unknown>> = [];

        transactionModel.customerProvidedDocuments?.forEach(document => {
          document.isErrorTooltipOpen = false;

          transactionDetailsRequests.push(
            this.getProcessingResults$(document.id).pipe(
              tap(results => {
                document.processingResult = results;
                document.shouldDisplayErrors = checkIfDocumentShouldDisplayErrors(document.processingResult) > 0;
              }),
              catchError(_error => of([])),
            ),
          );
        });

        if (transactionModel.assignedTo) {
          transactionDetailsRequests.push(this.loadAssignedAgent$(transactionModel.assignedTo).pipe(catchError(_error => of({}))));
        }

        transactionDetailsRequests.push(this.loadUser$(transactionModel.subjectUserId).pipe(catchError(_error => of({}))));

        return forkJoin(transactionDetailsRequests);
      }),
    );
  }

  public loadUser$(userId: string): Observable<UserModel> {
    return this._getUserById$(userId);
  }

  public loadEvents$(transactionId: string, businessObjectType: string, pagingRequestModel?: PagingRequestModel): Observable<AuditEventModel[]> {
    return this._getEvents$(transactionId, businessObjectType, pagingRequestModel);
  }

  public getDocumentRejectionReasons$(): Observable<Map<string, IEnumData>> {
    return this._enumerationsStateService.getEnumMap$(EnumMapType.DocumentRejectionReasons);
  }

  public updateCustomerProvidedDocument(
    transactionId: string,
    documentId: string,
    customerProvidedDocument: ICustomerProvidedDocument,
  ): Observable<ICustomerProvidedDocument> {
    return this._workApiRoutesService.updateTransactionDocumentsById$(transactionId, documentId, customerProvidedDocument).pipe(
      switchMap(async updatedDocument => {
        const mappedUpdatedDocument = await this._mapDocumentForRendering(updatedDocument);
        const updatedDocuments = this._customerProvidedDocuments.value.map(doc => (doc.id === mappedUpdatedDocument.id ? mappedUpdatedDocument : doc));
        this._customerProvidedDocuments.next(updatedDocuments);

        return mappedUpdatedDocument;
      }),
    );
  }

  public storeCustomerDocuments$(): Observable<ICustomerProvidedDocument[]> {
    if (this._customerProvidedDocuments.value.length) return of(this._customerProvidedDocuments.value);

    const transaction = this._formTransactionService.transaction;

    if (!transaction || !transaction.customerProvidedDocuments || transaction.customerProvidedDocuments.length === 0) {
      return EMPTY;
    }

    return of(transaction.customerProvidedDocuments).pipe(
      switchMap(async documents => {
        const mappedDocuments: ICustomerProvidedDocument[] = [];
        for (const document of documents) {
          mappedDocuments.push(await this._mapDocumentForRendering(document));
        }

        return mappedDocuments;
      }),
      tap(mappedDocuments => {
        this._customerProvidedDocuments.next(mappedDocuments);
      }),
    );
  }

  public createNote$(transactionId: string, noteModel: NoteModel): Observable<NoteModel> {
    return this.workApiRoutesService.createNote$(transactionId, noteModel);
  }

  public loadNotes$(transactionId: string, pagingRequestModel?: PagingRequestModel): Observable<NoteModel[]> {
    return this._getNotes$(transactionId, pagingRequestModel);
  }

  public getProcessingResults$(documentId: string): Observable<IProcessingResultSchema[]> {
    return this._documentApiRoutesService.getProcessingResults$(documentId);
  }

  public clearEvents() {
    this._events.next([]);
  }

  public clearNotes() {
    this._notes.next([]);
  }

  public clearCustomerProvidedDocuments() {
    this._customerProvidedDocuments.next([]);
  }

  public deleteNote$(transactionId: string, noteId: string): Observable<void> {
    return this._workApiRoutesService.deleteNote$(transactionId, noteId).pipe(
      tap(() => {
        return this._notes
          .pipe(
            take(1),
            tap(notes => {
              const updatedNotes = notes.filter(note => note.id !== noteId);
              this._notes.next(updatedNotes);
            }),
          )
          .subscribe();
      }),
      catchError(_error => {
        this._nuverialSnackBarService.notifyApplicationError();

        return EMPTY;
      }),
    );
  }

  public loadAssignedAgent$(userId: string): Observable<UserModel | undefined> {
    return this._userStateService.getUserById$(userId).pipe(
      tap(userModel => {
        if (!userModel) return;

        if (!this._agents.value.some(agents => agents.id === userId)) {
          this._agents.next([...this._agents.value, userModel]);
        }
      }),
    );
  }

  public loadAgencyUsers$(filters?: Filter[], pagingRequestModel?: PagingRequestModel): Observable<UserModel[]> {
    return this._getAgents$(filters, pagingRequestModel);
  }

  private _getAgents$(filters: Filter[] = [], pagingRequestModel?: PagingRequestModel): Observable<UserModel[]> {
    filters.push({ field: 'userType', value: 'agency' });

    return this._userApiRoutesService.getUsers$(filters, pagingRequestModel).pipe(
      tap(usersPaginationResp => {
        this._agentsPagination.next(usersPaginationResp.pagingMetadata);

        // Filter out existing users (agents)
        const newAgents = usersPaginationResp.users.filter(user => {
          return !this._agents.value.some(existingAgent => existingAgent.id === user.id);
        });

        this._agents.next([...this._agents.value, ...newAgents].sort((a, b) => a.displayName.localeCompare(b.displayName)));
      }),
      map(usersPaginationResp => usersPaginationResp.users),
    );
  }

  public updateTransactionPriority$(priority: string): Observable<TransactionModel> {
    const transactionModel = new TransactionModel();
    transactionModel.priority = priority;
    const updateTransactionOptions: UpdateTransactionOptions = {
      transaction: transactionModel.toPrioritySchema(),
      transactionId: this.transactionId,
    };

    return this._workApiRoutesService.updateTransactionById$(updateTransactionOptions);
  }

  public updateTransactionAssignedTo$(assignedTo: string): Observable<TransactionModel> {
    const transactionModel = new TransactionModel();
    transactionModel.assignedTo = assignedTo;

    const updateTransactionOptions: UpdateTransactionOptions = {
      transaction: transactionModel.toAssignedToSchema(),
      transactionId: this.transactionId,
    };

    return this._workApiRoutesService.updateTransactionById$(updateTransactionOptions);
  }

  public reviewTransaction$(action: string, taskId: string): Observable<TransactionModel> {
    const transactionModel = new TransactionModel();
    const updateTransactionOptions: UpdateTransactionOptions = {
      completeTask: true,
      taskId,
      transaction: transactionModel.toActionSchema(action),
      transactionId: this.transactionId,
    };

    return this._workApiRoutesService.updateTransactionById$(updateTransactionOptions).pipe(
      tap(updatedTransaction => {
        this._formTransactionService.transaction = updatedTransaction;
      }),
    );
  }

  public getNoteById$(transactionId: string, noteId: string): Observable<NoteModel> {
    return this._workApiRoutesService.getNote$(transactionId, noteId);
  }

  public editNote$(transactionId: string, noteId: string, noteModel: NoteModel): Observable<NoteModel> {
    return this._workApiRoutesService.updateNote$(transactionId, noteId, noteModel);
  }

  private async _mapDocumentForRendering(document: ICustomerProvidedDocument): Promise<ICustomerProvidedDocument> {
    return {
      ...document,
      label: this._formTransactionService.formConfiguration.getComponentLabelByKey(document.dataPath),
      reviewedByDisplayName: await firstValueFrom(this._userStateService.getUserDisplayName$(document.reviewedBy)),
    };
  }

  /**
   * clean up and reset state
   */
  public cleanUp() {
    this._user.next(new UserModel());
    this._events.next([]);
    this._eventsPagination.next(new PagingResponseModel());
    this._notes.next([]);
    this.clearCustomerProvidedDocuments();
  }
}
