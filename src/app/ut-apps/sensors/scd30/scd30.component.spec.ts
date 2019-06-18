import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Scd30Component } from './scd30.component';

describe('Scd30Component', () => {
  let component: Scd30Component;
  let fixture: ComponentFixture<Scd30Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Scd30Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Scd30Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
