import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Sps30Component } from './sps30.component';

describe('Sps30Component', () => {
  let component: Sps30Component;
  let fixture: ComponentFixture<Sps30Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Sps30Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Sps30Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
