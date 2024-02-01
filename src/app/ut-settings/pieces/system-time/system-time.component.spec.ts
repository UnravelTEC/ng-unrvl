import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SystemTimeComponent } from './system-time.component';

describe('SystemTimeComponent', () => {
  let component: SystemTimeComponent;
  let fixture: ComponentFixture<SystemTimeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SystemTimeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SystemTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
