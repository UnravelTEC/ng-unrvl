import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-ut-dashboard-tile',
  templateUrl: './ut-dashboard-tile.component.html',
  styleUrls: ['./ut-dashboard-tile.component.css']
})
export class UtDashboardTileComponent implements OnInit {
  @Input()
  title: string;
  @Input()
  icon: string;
  @Input()
  path: string;

  constructor() {}

  ngOnInit() {
    if (!this.title) {
      this.title = 'new App';
    }
    if (!this.icon) {
      this.icon = '/assets/example.jpg';
    }
    if (!this.path) {
      this.path = '/Apps/empty';
    }
  }
}
