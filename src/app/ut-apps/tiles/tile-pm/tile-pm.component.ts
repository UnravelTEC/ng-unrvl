import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-tile-pm',
  templateUrl: './tile-pm.component.html',
  styleUrls: ['../tiles.scss', './tile-pm.component.scss']
})
export class TilePmComponent implements OnInit {
  public value: number;

  @Input()
  height = 100;

  @Input()
  width = 100;

  extraDyGraphConfig = {
    // ppm0.5,ppm1,ppm10,ppm2.5,ppm4,pm1,pm10,pm2.5,pm4
    visibility: [false, false, false, false, false, true, true, true, true]
  };
  public pm10 = 0;

  highlights =
    '[ {"from": 0, "to": 25, "color": "green"}, \
       {"from": 25, "to": 50, "color": "rgba(0, 128, 0, 0.7)"}, \
       {"from": 50, "to": 100, "color": "yellow"}, \
       {"from": 100, "to": 150, "color": "orange"}, \
       {"from": 150, "to": 200, "color": "red"} ]';
  backGroundLevels = [
    // the color acts for "everything below $value"
    [0.01, 'white'], // first one not used
    [25, 'rgba(0, 128, 0, 0.678)'], // green
    [50, 'rgba(0, 128, 0, 0.35)'], // light green
    [100, 'rgba(255, 255, 0, 0.35)'], // yellow
    [150, 'rgba(255, 166, 0, 0.35)'], // orange
    [200, 'rgba(255, 0, 0, 0.35)'] // red
  ];

  constructor() {}

  ngOnInit() {}

  calculateRealPM(valueArray: Array<number>) {
    const retArray = [
      // pm0.5
      // pm1
      // pm2.5
      // pm4
      // pm10
    ];

    /* in ideal case if they came in order
    const len = valueArray.length;
    if (len <= 1) {
      return [];
    }
    let retArray = [];
    for (let i = 0; i < len; i++) {
      const element = valueArray[i];
      if (i === 0) {
        retArray.push(element);
      } else {
        retArray.push(element - valueArray[i - 1]);
      }
    } */

    return retArray;
  }
  calculatePmDist(headerlabels, data) {
    const datavalues = data.splice(1); // data included timestamp on [0]
    console.log('.');
  }
  log(arg) {
    console.log(arg);
    return 'ok';
  }
}
