import { async, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { BackendService, SystemInfoService } from '@typexs/base-ng';

describe('CardComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        DashboardComponent
      ],
      providers: [
        SystemInfoService, BackendService
      ]
    }).compileComponents();
  }));
  it('should create component', async(() => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

});
