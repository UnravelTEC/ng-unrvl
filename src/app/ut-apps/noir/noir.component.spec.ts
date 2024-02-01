import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NoirComponent } from './noir.component';

describe('NoirComponent', () => {
  let component: NoirComponent;
  let fixture: ComponentFixture<NoirComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NoirComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoirComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
