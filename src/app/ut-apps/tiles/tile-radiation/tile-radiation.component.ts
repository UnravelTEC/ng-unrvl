import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-tile-radiation',
  templateUrl: './tile-radiation.component.html',
  styleUrls: ['./tile-radiation.component.scss', '../tiles.scss']
})
export class TileRadiationComponent implements OnInit {
  public value: number;

  @Input()
  height = 100;

  @Input()
  width = 100;

  highlights =
    '[ {"from": 0, "to": 100, "color": "green"}, \
       {"from": 100, "to": 150, "color": "yellow"}, \
       {"from": 150, "to": 300, "color": "orange"}, \
       {"from": 300, "to": 3000, "color": "red"} ]';
  backGroundLevels = [
    // the color acts for "everything below $value"
    [0.01, 'white'], // first one not used
    [415, 'rgba(0, 128, 0, 0.678)'], // green
    [600, 'rgba(0, 128, 0, 0.35)'], // light green
    [1000, 'rgba(255, 255, 0, 0.35)'], // yellow
    [1500, 'rgba(255, 166, 0, 0.35)'], // orange
    [20000, 'rgba(255, 0, 0, 0.35)'] // red
  ];

  constructor() {}

  ngOnInit() {}
}
