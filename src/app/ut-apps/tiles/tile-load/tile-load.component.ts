import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { MqttService } from '../../../core/mqtt.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tile-load',
  templateUrl: './tile-load.component.html',
  styleUrls: ['./tile-load.component.scss']
})
export class TileLoadComponent implements OnInit, OnDestroy {
  @Input()
  height = 100;

  @Input()
  width = 100;

  public currentLoad = 42;
  private mqttSubscription$: Subscription;

  extraDyGraphConfig = {
    logscale: false
  };

  private mqttRequest = {
    topic: '+/system',
    tagFilters: undefined,
    valueFilters: ['system_load']
  };

  constructor(private mqtt: MqttService) {}

  ngOnInit() {
    const topic = this.mqttRequest.topic;
    this.mqtt.request(this.mqttRequest);
    this.mqttSubscription$ = this.mqtt.observableTopics$[topic].subscribe(
      (obj: Object) => this.updateLoad(obj)
    );
    this.triggerChange();
  }
  ngOnDestroy() {
    this.mqtt.unsubscribeTopic(this.mqttRequest.topic);
  }

  updateLoad(msg: Object) {
    if (msg['system_load']) {
      // console.log(msg);

      this.currentLoad = msg['system_load'];
      this.dygData.push([new Date(msg['UTS']), msg['system_load']]);
      this.triggerChange();
    }
  }

  dygLabels = ['Date', 'System Load'];
  dygData = [[new Date(new Date().valueOf() - 1000), 1], [new Date(), 0]]; // mit push dranhängen, wo machen wir die maxlen?
  changeTrigger = false;

  triggerChange() {
    this.changeTrigger = !this.changeTrigger;
  }

  // MQTT queries
  // topic, topic-filter, payload-filter,

  /* example queries
    all temperatures
    all humidity
    all brightness
    temperature from one sensor
    all external temperatures
  */
}
