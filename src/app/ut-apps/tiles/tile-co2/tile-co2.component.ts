import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-tile-co2',
  templateUrl: './tile-co2.component.html',
  styleUrls: ['./tile-co2.component.scss']
})
export class TileCo2Component implements OnInit {
  public value: number;

  @Input()
  height = 100;

  @Input()
  width = 100;

  highlights =
    '[ {"from": 0, "to": 415, "color": "green"}, \
       {"from": 415, "to": 600, "color": "rgba(0, 128, 0, 0.7)"}, \
       {"from": 600, "to": 1000, "color": "yellow"}, \
       {"from": 1000, "to": 1500, "color": "orange"}, \
       {"from": 1500, "to": 3000, "color": "red"} ]';
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
