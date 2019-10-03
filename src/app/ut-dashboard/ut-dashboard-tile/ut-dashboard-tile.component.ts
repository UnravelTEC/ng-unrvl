import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-ut-dashboard-tile',
  templateUrl: './ut-dashboard-tile.component.html',
  styleUrls: ['./ut-dashboard-tile.component.css']
})
export class UtDashboardTileComponent implements OnInit {
  @Input()
  title = 'new App';
  @Input()
  icon = 'example.png'; // prefix /assets/ added in html
  @Input()
  path = '/Apps/empty';
  @Input()
  bg = '#5991b2';

  constructor() {}

  ngOnInit() {}

  getBg() {
    return this.bg;
  }
}
