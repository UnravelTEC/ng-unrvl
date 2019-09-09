import { Component, OnInit, Input } from '@angular/core';
import { colors } from '../../../shared/colors';

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
       {"from": 300, "to": 350, "color": "red"} ]';
  backGroundLevels = [
    // the color acts for "everything below $value"
    [0.01, 'white'], // first one not used
    [100, colors.bg.green],
    [150, colors.bg.yellow],
    [300, colors.bg.orange],
    [3500, colors.bg.red]
  ];

  constructor() {}

  ngOnInit() {}
}
