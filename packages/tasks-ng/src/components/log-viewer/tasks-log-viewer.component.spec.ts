import { ComponentFixture, fakeAsync, getTestBed, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Injector, SimpleChange } from '@angular/core';
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
import { TasksLogViewerComponent } from './tasks-log-viewer.component';
import { BackendTasksService } from '../../services/backend-tasks.service';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpRequest } from '@angular/common/http';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { Observable, of } from 'rxjs';
import range from 'lodash/range';


const generateMessages = (from: number, amount: number) => {
  const messages = range(from, amount).map(x => {
    const message = {
      timestamp: Date.now(),
      message: x + ': Hallo welt ',
      level: 'INFO',
      args: { id: x }
    };
    return JSON.stringify(message);
  });
  return messages;
};

/**
 * TasksLogViewerComponent
 * ---------------
 *
 */
describe('TasksLogViewerComponent', () => {
  let fixture: ComponentFixture<TasksLogViewerComponent>;
  let component: TasksLogViewerComponent;
  let injector: TestBed;
  let httpMock: HttpTestingController;
  let taskService: BackendTasksService;


  beforeEach(() => {
    const testBed = TestBed.configureTestingModule({
      declarations: [
        TasksLogViewerComponent
      ],
      imports: [
        BrowserTestingModule,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useClass: NoopAuthService },
        { provide: BackendService, useClass: HttpBackendService },
        BackendTasksService,
        MessageService,
        SystemInfoService,
        AppService,
        Injector,
        EntityResolverService,
        StorageService,
        DatePipe
      ]
    });


    // service = injector.get(BackendTasksService);
    fixture = testBed.createComponent(TasksLogViewerComponent);
    component = fixture.componentInstance;
    taskService = testBed.inject(BackendTasksService);
    httpMock = testBed.inject(HttpTestingController);
    Log.debug = console.log.bind(console);
  });


  afterEach(() => {
    if (httpMock) {
      httpMock.verify();

    }
  });


  it('should have a component instance', () => {
    expect(fixture.componentInstance).not.toBeNull();
  });


  /**
   * 'less' is default mode
   */
  it('less should load as long data is passed', () => {
    component.nodeId = 'nodeId';
    component.runnerId = 'runnerId';
    expect(component.mode).toEqual('less');
    let inc = 3;
    let chunks = [];
    let count = 0;
    const getTaskLogSpy = spyOn(taskService, 'getTaskLog')
      .and.callFake((runnerId: string, nodeId: string, from: number, size: number): Observable<any[]> => {
        inc--;
        const messages = generateMessages(from, from + Math.random() * size);
        if (inc > 0) {
          chunks.push(messages);
          count += messages.length;
          return of([messages.join('\n')]);
        } else {
          return of([]);
        }
      });
    fixture.detectChanges();
    expect(component.log).not.toBeNull();
    const logLines = component.log.split('\n');
    expect(logLines).toHaveSize(count);
  });

  /**
   * 'less' while task running
   */
  it('less should load as long as task running', fakeAsync(() => {
    component.nodeId = 'nodeId';
    component.runnerId = 'runnerId';
    component.autoUpdate = true;
    component.offset = 100;
    expect(component.mode).toEqual('less');
    let inc = 0;
    let chunks = [];
    let count = 0;
    const getTaskLogSpy = spyOn(taskService, 'getTaskLog')
      .and.callFake((runnerId: string, nodeId: string, from: number, size: number): Observable<any[]> => {
        const messages = generateMessages(from, from + Math.random() * size);
        if (inc > 0) {
          inc--;
          chunks.push(messages);
          count += messages.length;
          return of([messages.join('\n')]);
        } else {
          return of([]);
        }
      });
    fixture.detectChanges();
    expect(component.log).toEqual('');

    inc = 2;
    tick(100);

    expect(component.log.length).toBeGreaterThan(0);
    let logLines = component.log.split('\n');
    expect(logLines).toHaveSize(count);

    inc = 2;
    tick(100);

    expect(component.log.length).toBeGreaterThan(0);
    logLines = component.log.split('\n');
    expect(logLines).toHaveSize(count);

    component.disableAutoUpdate();
  }));


  it('switch mode from less to tail', () => {
    component.nodeId = 'nodeId';
    component.runnerId = 'runnerId';
    const newLogSpy = spyOn(component, 'newLog').and.returnValue(null);
    component.ngOnChanges({
      mode: new SimpleChange(null, 'less', true)
    });
    expect(newLogSpy.calls.count()).toEqual(0);
    // expect(component.mode).toEqual('less');

    component.ngOnChanges({
      mode: new SimpleChange('less', 'tail', false)
    });
    expect(newLogSpy.calls.count()).toEqual(1);
    // expect(component.mode).toEqual('tail');
  });
});
