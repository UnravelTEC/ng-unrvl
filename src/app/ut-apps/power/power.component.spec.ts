import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PowerComponent } from './power.component';

describe('PowerComponent', () => {
  let component: PowerComponent;
  let fixture: ComponentFixture<PowerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PowerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PowerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
