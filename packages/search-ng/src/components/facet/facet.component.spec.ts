import { async, TestBed } from '@angular/core/testing';
import { SearchFacetComponent } from './facet.component';

describe('SearchFacetComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SearchFacetComponent
      ]
    }).compileComponents();
  }));
  it('should create the facet', async(() => {
    const fixture = TestBed.createComponent(SearchFacetComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

});
