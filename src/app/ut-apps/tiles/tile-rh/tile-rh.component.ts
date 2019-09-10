import { Component, OnInit, Input } from '@angular/core';
import { colors } from '../../../shared/colors';

@Component({
  selector: 'app-tile-rh',
  templateUrl: './tile-rh.component.html',
  styleUrls: ['../tiles.scss', './tile-rh.component.scss']
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
    [30, colors.bg.red],
    [35, colors.bg.orange],
    [40, colors.bg.yellow],
    [55, colors.bg.green],
    [60, colors.bg.yellow],
    [95, colors.bg.orange],
    [100, colors.bg.red]

  ];
  constructor() {}

  ngOnInit() {}
}
