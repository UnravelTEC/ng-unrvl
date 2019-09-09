import { Component, OnInit, Input } from '@angular/core';
import { colors } from '../../../shared/colors';

@Component({
  selector: 'app-tile-brightness',
  templateUrl: './brightness.component.html',
  styleUrls: ['./brightness.component.scss','../tiles.scss']
})
export class BrightnessComponent implements OnInit {
  public value: number;

  @Input()
  height = 100;

  @Input()
  width = 100;

  highlights =
    '[ {"from": 0, "to": 400, "color": "red"}, \
     {"from": 400, "to": 1000, "color": "yellow"}, \
     {"from": 1000, "to": 3000, "color": "green"} \
    ]';
  backGroundLevels = [
    // the color acts for "everything below $value"
    [0.01, 'white'], // first one not used
    [400, colors.bg.red],
    [1000, colors.bg.yellow],
    [20000, colors.bg.green]
  ];

  constructor() {}

  ngOnInit() {}
}
