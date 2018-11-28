import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DygraphDevComponent } from './dygraph-dev.component';

describe('DygraphDevComponent', () => {
  let component: DygraphDevComponent;
  let fixture: ComponentFixture<DygraphDevComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DygraphDevComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DygraphDevComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
