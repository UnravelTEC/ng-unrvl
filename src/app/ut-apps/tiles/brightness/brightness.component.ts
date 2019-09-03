import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-tile-brightness',
  templateUrl: './brightness.component.html',
  styleUrls: ['./brightness.component.scss']
})
export class BrightnessComponent implements OnInit {
  public value: number;

  @Input()
  height = 100;

  @Input()
  width = 100;

  step = 1000;

  extraDyGraphConfig = {
    strokeWidth: 2.0,
    logscale: true,
    legend: 'never',
    drawGrid: false,
    drawAxis: false,
    highlightSeriesBackgroundAlpha: 1,
    highlightCircleSize: 0,
    highlightSeriesOpts: { strokeBorderWidth: 0, strokeWidth: 2.0 },
    colors: ['blue', 'green', '#FF00FF', 'red', '#FFFF00']
  };
  graphstyle = {
    position: 'absolute',
    top: '0',
    bottom: '0',
    left: '0',
    right: '0'
  };

  startTime = '3m';

  constructor() {}

  ngOnInit() {}
}
