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
  private mqttSubscription$: Subscription

  constructor(private mqtt: MqttService) {}

  ngOnInit() {
    const topic = '+/system';
    this.mqtt.subscribeTopic(topic);
    this.mqttSubscription$ = this.mqtt.observableTopics$[topic].subscribe((obj: Object) =>
      this.updateLoad(obj)
    );

    // test only
    this.mqtt.emitChange({ system_load: 42 });
  }

  updateLoad(msg: Object) {
    if(msg['system_load']) {
      this.currentLoad = Number(msg['system_load'])
    }
  }
}
