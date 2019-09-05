import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-tile-rh',
  templateUrl: './tile-rh.component.html',
  styleUrls: ['../tiles.scss', './tile-rh.component.scss' ]
})
export class TileRhComponent implements OnInit {
  public value: number;

  @Input()
  height = 100;

  @Input()
  width = 100;

  highlights =
    '[ {"from": 0, "to": 30, "color": "red"}, \
       {"from": 30, "to": 35, "color": "orange"}, \
       {"from": 35, "to": 40, "color": "yellow"}, \
       {"from": 40, "to": 55, "color": "green"}, \
       {"from": 55, "to": 60, "color": "yellow"}, \
       {"from": 60, "to": 95, "color": "orange"}, \
       {"from": 95, "to": 100, "color": "red"} ]';
  backGroundLevels = [
    // the color acts for "everything below $value"
    [0.01, 'white'], // first one not used
    [30, 'rgba(255, 0, 0, 0.35)'], // red
    [35, 'rgba(255, 166, 0, 0.35)'], // orange
    [40, 'rgba(255, 255, 0, 0.35)'], // yellow
    [55, 'rgba(0, 128, 0, 0.678)'], // green
    [60, 'rgba(255, 255, 0, 0.35)'], // yellow
    [95, 'rgba(255, 166, 0, 0.35)'], // orange
    [100, 'rgba(255, 0, 0, 0.35)'] // red
    // [600, 'rgba(0, 128, 0, 0.35)'], // light green
  ];
  constructor() {}

  ngOnInit() {}
}
