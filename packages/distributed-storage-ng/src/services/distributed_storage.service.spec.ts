import { getTestBed, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DistributedStorageService } from './distributed_storage.service';
import { RouterTestingModule } from '@angular/router/testing';
import { DistributedStorageModule } from '../module';
import { AuthService, BackendService, EntityResolverService, MessageService } from '@typexs/base-ng';

describe('UserAuthService', () => {
  let service: DistributedStorageService;
  let injector: TestBed;
  let httpMock: HttpTestingController;


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        // HttpClientTestingModule,
        // RouterTestingModule,
        // DistributedStorageModule
      ],
      providers: [
        { provide: MessageService },
        { provide: EntityResolverService },
        { provide: AuthService },
        { provide: BackendService },
        { provide: DistributedStorageService }
        // {
        //   provide: HTTP_INTERCEPTORS,
        //   useClass: AuthTokenInterceptor,
        //   multi: true
        // }
      ]
    });

    injector = getTestBed();

    service = injector.get(DistributedStorageService);
    // httpMock = injector.get(HttpTestingController);

  });


  afterEach(() => {
    // httpMock.verify();
  });


  it('should have a service instance and not be initialised', () => {
    expect(service).not.toBeNull();

  });

});
