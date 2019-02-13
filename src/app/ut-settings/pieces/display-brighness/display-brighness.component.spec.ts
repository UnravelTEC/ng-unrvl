import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayBrighnessComponent } from './display-brighness.component';

describe('DisplayBrighnessComponent', () => {
  let component: DisplayBrighnessComponent;
  let fixture: ComponentFixture<DisplayBrighnessComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DisplayBrighnessComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayBrighnessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
