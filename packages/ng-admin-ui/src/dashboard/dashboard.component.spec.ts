import { async, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';

describe('CardComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        DashboardComponent
      ]
    }).compileComponents();
  }));
  it('should create component', async(() => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

});
