import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UtDygraphComponent } from './ut-dygraph.component';

describe('UtDygraphComponent', () => {
  let component: UtDygraphComponent;
  let fixture: ComponentFixture<UtDygraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UtDygraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UtDygraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
