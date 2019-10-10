import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { colors } from '../../../shared/colors';
import { MqttService } from '../../../core/mqtt.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';

@Component({
  selector: 'app-tile-brightness',
  templateUrl: './brightness.component.html',
  styleUrls: ['./brightness.component.scss', '../tiles.scss']
})
export class BrightnessComponent implements OnInit, OnDestroy {
  public value: number;
  public htmlColor: string;

  @Input()
  height = 100;

  @Input()
  width = 100;

  extraDyGraphConfig = { valueRange: [0.1, undefined] };

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
  private mqttRequest = {
    topic: '+/sensors/+/luminosity',
    tagFilters: undefined,
    valueFilters: ['visible_lux', 'visible_raw'],
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
  ngOnDestroy() {
    this.mqtt.unsubscribeTopic(this.mqttRequest.topic);
  }

  update(msg: Object) {
    this.value = this.h.getDeep(msg, [
      'values',
      this.mqttRequest.valueFilters[0]
    ]);
    if (this.value !== undefined) {
      this.cleanInitValues();
      const dygValue = this.value === 0 ? 0.11 : this.value; // because of log scale of DyGraph
      this.dygData.push([new Date(msg['UTS'] * 1000), dygValue]);
      console.log(this.value);

      this.preventTooLargeGrowth();

      this.htmlColor = this.h.calcHTMLColor(
        msg['values']['red_lux'],
        msg['values']['green_lux'],
        msg['values']['blue_lux']
      );
    }
    this.triggerChange();
  }

  dygLabels = ['Date', 'Brightness'];

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
}
