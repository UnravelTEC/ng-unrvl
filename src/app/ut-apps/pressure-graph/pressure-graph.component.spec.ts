import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PressureGraphComponent } from './pressure-graph.component';

describe('PressureGraphComponent', () => {
  let component: PressureGraphComponent;
  let fixture: ComponentFixture<PressureGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PressureGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PressureGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
