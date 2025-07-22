import { waitForAsync, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { BackendService, SystemInfoService } from '@typexs/base-ng';

describe('CardComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        DashboardComponent
      ],
      providers: [
        SystemInfoService, BackendService
      ]
    }).compileComponents();
  }));
  it('should create component', waitForAsync(() => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

});
