import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WeihnachtsvorlesungComponent } from './weihnachtsvorlesung.component';

describe('WeihnachtsvorlesungComponent', () => {
  let component: WeihnachtsvorlesungComponent;
  let fixture: ComponentFixture<WeihnachtsvorlesungComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WeihnachtsvorlesungComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WeihnachtsvorlesungComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
