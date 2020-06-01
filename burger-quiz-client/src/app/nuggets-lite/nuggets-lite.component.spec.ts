import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NuggetsLiteComponent } from './nuggets-lite.component';

describe('NuggetsLiteComponent', () => {
  let component: NuggetsLiteComponent;
  let fixture: ComponentFixture<NuggetsLiteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NuggetsLiteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NuggetsLiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
