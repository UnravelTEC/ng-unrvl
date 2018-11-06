import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IaqComponent } from './iaq.component';

describe('IaqComponent', () => {
  let component: IaqComponent;
  let fixture: ComponentFixture<IaqComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IaqComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IaqComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
