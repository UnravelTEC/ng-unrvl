import { Component, OnInit, Input } from '@angular/core';
import { MqttService } from '../../../core/mqtt.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tile-load',
  templateUrl: './tile-load.component.html',
  styleUrls: ['./tile-load.component.scss']
})
export class TileLoadComponent implements OnInit {
  @Input()
  height = 100;

  @Input()
  width = 100;

  public currentLoad = 42;
  private mqttSubscription$: Subscription;

  extraDyGraphConfig = {
    logscale: false
  };

    constructor(private mqtt: MqttService) {}

  ngOnInit() {
    const topic = '+/system';
    this.mqtt.subscribeTopic(topic);
    this.mqttSubscription$ = this.mqtt.observableTopics$[topic].subscribe(
      (obj: Object) => this.updateLoad(obj)
    );
    this.triggerChange();
  }

  updateLoad(msg: Object) {
    if (msg['system_load']) {
      // console.log(msg);

      this.currentLoad = msg['system_load'];
      this.dygData.push([new Date(msg['UTS']), msg['system_load']]);
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
  dygLabels = ['Date', 'Atmospheric Pressure']; // human readable

  dygLabels = ['Date', 'System Load'];
  dygData = [[new Date(new Date().valueOf() - 1000), 1], [new Date(), 0]]; // mit push dranhängen, wo machen wir die maxlen?
  changeTrigger = false;

  triggerChange() {
    this.changeTrigger = !this.changeTrigger;
  }

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
