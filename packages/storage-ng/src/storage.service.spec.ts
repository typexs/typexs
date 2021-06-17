import { getTestBed, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { API_CTRL_STORAGE_METADATA_ALL_ENTITIES } from '@typexs/server';
import { StorageService } from './storage.service';
import {
  AuthService,
  BackendService,
  EntityResolverService,
  HttpBackendService,
  Log,
  MessageService,
  NoopAuthService
} from '@typexs/base-ng';
import { IJsonSchema7 } from '@allgemein/schema-api';


/**
 * HttpBackendService
 * ---------------
 *
 * - check ping
 * - check reload routes
 *
 */
describe('StorageService', () => {
  let service: StorageService;
  let injector: TestBed;
  let httpMock: HttpTestingController;


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        { provide: BackendService, useClass: HttpBackendService },
        { provide: AuthService, useClass: NoopAuthService },
        MessageService,
        EntityResolverService,
        StorageService
      ]
    });

    injector = getTestBed();

    httpMock = injector.get(HttpTestingController);
    Log.debug = console.log.bind(console);
    // const response = {time: new Date()};
    // // successful response
    // const req = httpMock.expectOne('/api' + API_CTRL_SERVER_PING);
    // req.flush(response);
    // const req2 = httpMock.expectOne('/api' + API_CTRL_SERVER_ROUTES);
    // const backendClientService: HttpBackendService = injector.get(BackendService) as HttpBackendService;
    // req2.flush(
    //   [{
    //     route: '/api/ping',
    //     method: 'get',
    //     context: 'api',
    //     authorized: false
    //   },{
    //     route: '/api/routes',
    //     method: 'get',
    //     context: 'api',
    //     authorized: false
    //   }, {
    //     route: backendClientService.apiUrl(API_CTRL_STORAGE_METADATA_ALL_ENTITIES),
    //     method: 'get',
    //     context: 'api',
    //     authorized: false
    //   }]);

  });


  afterEach(() => {
    httpMock.verify();

  });


  it('should have a service instance and load metadata', () => {
    const entitiesMetadata: IJsonSchema7[] = [];
    const backendClientService: HttpBackendService = injector.get(BackendService) as HttpBackendService;
    backendClientService.getState().next('online');
    backendClientService.addRoute({
      route: backendClientService.apiUrl(API_CTRL_STORAGE_METADATA_ALL_ENTITIES),
      method: 'get',
      context: 'api',
      authorized: false
    });

    service = injector.get(StorageService);
    expect(service).not.toBeNull();

    const req = httpMock.expectOne('/api' + API_CTRL_STORAGE_METADATA_ALL_ENTITIES);
    req.flush(entitiesMetadata);


  });


  // it('should pass primative query parameters', () => {
  //
  //
  // });

});
