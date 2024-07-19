import { getTestBed, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BackendTasksService } from './backend-tasks.service';
import { Injector } from '@angular/core';
import { StorageService } from '@typexs/storage-ng/public_api';
import {
  AppService,
  AuthService,
  BackendService,
  EntityResolverService,
  HttpBackendService,
  Log,
  MessageService,
  NoopAuthService,
  SystemInfoService
} from '@typexs/base-ng';


/**
 * HttpBackendService
 * ---------------
 *
 * - check ping
 * - check reload routes
 *
 */
describe('BackendTasksService', () => {
  let service: BackendTasksService;
  let injector: TestBed;
  let httpMock: HttpTestingController;


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useClass: NoopAuthService },
        { provide: BackendService, useClass: HttpBackendService },
        MessageService,
        SystemInfoService,
        BackendTasksService,
        AppService,
        Injector,
        EntityResolverService,
        HttpBackendService,
        StorageService
      ]
    });

    injector = getTestBed();

    service = injector.get(BackendTasksService);
    httpMock = injector.get(HttpTestingController);
    Log.debug = console.log.bind(console);
  });


  afterEach(() => {
    if (httpMock) {
      httpMock.verify();

    }

  });


  it('should have a service instance', () => {
    expect(service).not.toBeNull();

  });


});
