import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RHTComponent } from './r-ht.component';

describe('RHTComponent', () => {
  let component: RHTComponent;
  let fixture: ComponentFixture<RHTComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RHTComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RHTComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
