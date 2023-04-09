import { async, TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardComponent
      ]
    }).compileComponents();
  }));
  it('should create component', async(() => {
    const fixture = TestBed.createComponent(CardComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

});
