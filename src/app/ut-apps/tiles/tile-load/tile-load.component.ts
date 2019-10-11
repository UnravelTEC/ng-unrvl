import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { MqttService } from '../../../core/mqtt.service';

import { Subscription } from 'rxjs';
import cloneDeep from 'lodash-es/cloneDeep';

@Component({
  selector: 'app-tile-load',
  templateUrl: './tile-load.component.html',
  styleUrls: ['./tile-load.component.scss', '../tiles.scss']
})
export class TileLoadComponent implements OnInit, OnDestroy {
  @Input()
  height = 100;

  @Input()
  width = 100;
  fontsize_px = String(this.width/9) + 'px';

  public currentLoad: number = undefined;
  private mqttSubscription$: Subscription;

  extraDyGraphConfig = {
    logscale: false,
    colors: ['red']
  };

  private mqttRequest = {
    topic: '+/system',
    tagFilters: undefined,
    valueFilters: ['system_load'],
    callBack: (obj: Object) => this.updateLoad(obj)
  };
  private maxDataLength = 300;

  highlights =
    '[ {"from": 0, "to": 1, "color": "green"}, \
       {"from": 1, "to": 3, "color": "yellow"}, \
       {"from": 3, "to": 5, "color": "orange"}, \
       {"from": 5, "to": 12, "color": "red"} ]';
  backGroundLevels = [
    // the color acts for "everything below $value"
    [0.01, 'white'], // first one not used
    [1, 'rgba(0, 128, 0, 0.678)'], // green
    [3, 'rgba(255, 255, 0, 0.35)'], // yellow
    [5, 'rgba(255, 166, 0, 0.35)'], // orange
    [200, 'rgba(255, 0, 0, 0.35)'] // red
  ];

  constructor(private mqtt: MqttService) {}

  ngOnInit() {
    this.mqttSubscription$ = this.mqtt.request(this.mqttRequest);
    this.triggerChange();
  }
  ngOnDestroy() {
    this.mqtt.unsubscribeTopic(this.mqttRequest.topic);
  }

  triggerChange() {
    this.changeTrigger = !this.changeTrigger;
  }

  updateLoad(msg: Object) {
    if (msg['system_load']) {
      // console.log(msg);

      this.currentLoad = msg['system_load'];
      const newRow = [new Date(msg['UTS'] * 1000), msg['system_load']];
      if (
        this.dygData.length === 2 &&
        this.dygData[0][1] === 0 &&
        this.dygData[1][1] === 1
      ) {
        console.log('initializing');
        this.dygData = [
          [new Date(msg['UTS'] * 1000 - 3000), msg['system_load']],
          newRow
        ];
      } else {
        this.dygData.push(newRow);
      }
      if (this.dygData.length > this.maxDataLength) {
        this.dygData.shift();
      }
      // console.log(cloneDeep(this.dygData));

      this.triggerChange();
    }
  }

  /* labels should be something that identifies a series:
  sources:
   * topic ($hostname/sensor/$sensor/$measurement)
   * tags (at least a set of selected, e.g. "id")
   * fieldname

   or $hostname/system/cpu_temperature_degC
  */
  dygSeries = [
    '$hostname/$sensorname/$measurement/$id/$fieldname',
    'Henri/BME280/i2c-1_0x77/gas/pressure_hPa'
  ];
  dygLabels = ['Date', 'System load']; // human readable

  dygData = [[new Date(new Date().valueOf() - 1000), 0], [new Date(), 1]]; // mit push dranhängen, wo machen wir die maxlen?
  // dygData = [[new Date(), 0]];
  changeTrigger = false;

  // MQTT queries
  // topic, topic-filter, payload-filter {tags, fields}

  /* example queries
    all temperatures
    all humidity
    all brightness
    temperature from one sensor
    all external temperatures
  */
}
