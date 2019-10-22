import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { colors } from '../../../shared/colors';
import { MqttService } from '../../../core/mqtt.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';

@Component({
  selector: 'app-tile-uv',
  templateUrl: './tile-uv.component.html',
  styleUrls: ['../tiles.scss', './tile-uv.component.scss']
})
export class TileUvComponent implements OnInit, OnDestroy {
  public uva: number;
  public uvb: number;

  @Input()
  height = 100;

  @Input()
  width = 100;
  fontsize_px = String(this.width / 9) + 'px';

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
    topic: '+/sensors/VEML6075/luminosity',
    tagFilters: undefined,
    valueFilters: ['UVA_raw', 'UVB_raw', 'visible_raw', 'ir_raw'],
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
    const uva = this.h.getDeep(msg, [
      'values',
      this.mqttRequest.valueFilters[0]
    ]);
    if (uva >= 0) {
      const uvb = this.h.getDeep(msg, [
        'values',
        this.mqttRequest.valueFilters[1]
      ]);
      const vis = this.h.getDeep(msg, [
        'values',
        this.mqttRequest.valueFilters[2]
      ]);
      const ir = this.h.getDeep(msg, [
        'values',
        this.mqttRequest.valueFilters[3]
      ]);
      this.cleanInitValues();

      this.dygData.push([new Date(msg['UTS'] * 1000), uva, uvb, vis, ir]);
      this.uva = uva;
      this.uvb = uvb;

      this.triggerChange();
    }
  }

  dygLabels = ['Date', 'UVA', 'UVB', 'Vis', 'IR'];

  private initDataValue = 0.042;
  dygData = [
    [new Date(new Date().valueOf() - 1), this.initDataValue, 0, 0, 0],
    [new Date(), this.initDataValue, 0, 0, 0]
  ];
  cleanInitValues() {
    if (
      this.dygData.length === 2 &&
      this.dygData[0][1] === this.initDataValue
    ) {
      this.dygData.shift();
    }
  }
}
