import { TestBed, waitForAsync } from '@angular/core/testing';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardComponent
      ]
    }).compileComponents();
  }));
  it('should create component', waitForAsync(() => {
    const fixture = TestBed.createComponent(CardComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

});
