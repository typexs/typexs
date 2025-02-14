import { waitForAsync, TestBed } from '@angular/core/testing';
import { SearchFacetComponent } from './facet.component';

describe('SearchFacetComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        SearchFacetComponent
      ]
    }).compileComponents();
  }));
  it('should create the facet', waitForAsync(() => {
    const fixture = TestBed.createComponent(SearchFacetComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

});
