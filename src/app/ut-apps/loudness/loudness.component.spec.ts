import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoudnessComponent } from './loudness.component';

describe('LoudnessComponent', () => {
  let component: LoudnessComponent;
  let fixture: ComponentFixture<LoudnessComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoudnessComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoudnessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
