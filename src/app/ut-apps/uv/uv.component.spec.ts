import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UvComponent } from './uv.component';

describe('UvComponent', () => {
  let component: UvComponent;
  let fixture: ComponentFixture<UvComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UvComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
