import { Component, OnInit, Input } from '@angular/core';
import { MqttService } from '../../../core/mqtt.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';

@Component({
  selector: 'app-tile-pm',
  templateUrl: './tile-pm.component.html',
  styleUrls: ['../tiles.scss', './tile-pm.component.scss']
})
export class TilePmComponent implements OnInit {
  @Input()
  height = 100;

  @Input()
  width = 100;

  public pm10 = 0;
  public particle_values = {
    '10': 0,
    '4': 0,
    '2.5': 0,
    '1': 0,
    '0.5': 0
  };

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
  private mqttRequest = {
    topic: '+/sensors/SPS30/+',
    tagFilters: undefined,
    valueFilters: [
      'p10_ugpm3',
      'p10_ppcm3',
      'p4_ppcm3',
      'p2.5_ppcm3',
      'p1_ppcm3',
      'p0.5_ppcm3'
    ],
    callBack: (obj: Object) => this.update(obj)
  };

  changeTrigger = false;
  triggerChange() {
    this.changeTrigger = !this.changeTrigger;
  }

  constructor(private mqtt: MqttService, private h: HelperFunctionsService) {}

  ngOnInit() {
    this.mqtt.request(this.mqttRequest);
    this.triggerChange();
  }

  update(msg: Object) {
    const values = this.h.getDeep(msg, ['values']);
    if (values) {
      this.pm10 = values['p10_ugpm3'];
      this.cleanInitValues();
      this.dygData.push([new Date(msg['UTS'] * 1000), this.pm10]);
      for( var key in this.particle_values ) {
        const values_key = 'p' + key + '_ppcm3';
        if(values[values_key]) {
          this.particle_values[key] = values[values_key];
        }
      }
      this.preventTooLargeGrowth();
    }
    this.triggerChange();
  }

  dygLabels = ['Date', 'pm10'];

  private initDataValue = 0.042;
  dygData = [
    [new Date(new Date().valueOf() - 1), this.initDataValue],
    [new Date(), this.initDataValue]
  ];
  cleanInitValues() {
    if (
      this.dygData.length === 2 &&
      this.dygData[0][1] === this.initDataValue
    ) {
      this.dygData.shift();
    }
  }
  preventTooLargeGrowth() {
    while (this.dygData.length > 300) {
      this.dygData.shift();
    }
  }

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
