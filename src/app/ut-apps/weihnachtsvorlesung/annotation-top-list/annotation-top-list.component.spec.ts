import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationTopListComponent } from './annotation-top-list.component';

describe('AnnotationTopListComponent', () => {
  let component: AnnotationTopListComponent;
  let fixture: ComponentFixture<AnnotationTopListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnnotationTopListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnotationTopListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
