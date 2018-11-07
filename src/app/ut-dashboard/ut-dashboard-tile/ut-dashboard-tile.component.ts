import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-ut-dashboard-tile',
  templateUrl: './ut-dashboard-tile.component.html',
  styleUrls: ['./ut-dashboard-tile.component.css']
})
export class UtDashboardTileComponent implements OnInit {

  title = "new App";
  icon = "/assets/example.jpg";
  path = "/Apps/IAQ";

  constructor() { }

  ngOnInit() {
  }

}
