import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdcComponent } from './adc.component';

describe('AdcComponent', () => {
  let component: AdcComponent;
  let fixture: ComponentFixture<AdcComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdcComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
