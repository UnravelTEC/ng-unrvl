import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VifComponent } from './vif.component';

describe('VifComponent', () => {
  let component: VifComponent;
  let fixture: ComponentFixture<VifComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VifComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VifComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
