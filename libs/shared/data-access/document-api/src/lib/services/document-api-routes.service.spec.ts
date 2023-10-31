import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpTestingModule } from '@dsg/shared/data-access/http';
import { DocumentMock, DocumentModel, UploadedDocumentMock, UploadedDocumentModel } from '../models';
import { DocumentApiRoutesService } from './document-api-routes.service';
import { DocumentUtil } from './utils/document.util';

/* eslint-disable @typescript-eslint/dot-notation */
describe('DocumentApiService', () => {
  let service: DocumentApiRoutesService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpTestingModule],
    });
    service = TestBed.inject(DocumentApiRoutesService);
    httpTestingController = TestBed.inject(HttpTestingController);

    jest.spyOn<any, any>(service, '_handlePost$');
    jest.spyOn<any, any>(service, '_handleGet$');
    jest.spyOn<any, any>(service, '_handlePut$');
    jest.spyOn<any, any>(service, '_handleDelete$');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('uploadDocument$', done => {
    const mockDocumentModel = new DocumentModel(DocumentMock);
    const file = new File([], 'test.doc', { type: 'text/plain' });

    service.uploadDocument$(file).subscribe(documentModel => {
      if (documentModel) {
        expect(documentModel).toEqual(mockDocumentModel);
        expect(service['_handlePost$']).toHaveBeenCalledWith(`/v1/documents`, DocumentUtil.createFormData(file), { observe: 'events', reportProgress: true });
        done();
      }
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/documents`);
    expect(req.request.method).toEqual('POST');
    req.flush(DocumentMock);
  });

  it('getUploadedDocument$', done => {
    const mockUploadDocumentModel = new UploadedDocumentModel(UploadedDocumentMock);

    service.getUploadedDocument$(mockUploadDocumentModel.id).subscribe(uploadDocumentModel => {
      expect(uploadDocumentModel).toEqual(mockUploadDocumentModel);
      expect(service['_handleGet$']).toHaveBeenCalledWith(`/v1/documents/${mockUploadDocumentModel.id}`);
      done();
    });

    const req = httpTestingController.expectOne(`${service['_baseUrl']}/v1/documents/${mockUploadDocumentModel.id}`);
    expect(req.request.method).toEqual('GET');
    req.flush(UploadedDocumentMock);
  });
});
