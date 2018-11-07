import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UtDashboardTileComponent } from './ut-dashboard-tile.component';

describe('UtDashboardTileComponent', () => {
  let component: UtDashboardTileComponent;
  let fixture: ComponentFixture<UtDashboardTileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UtDashboardTileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UtDashboardTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
