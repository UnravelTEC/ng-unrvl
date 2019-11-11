import { Component, OnInit, OnDestroy } from '@angular/core';
import { MqttService } from '../../core/mqtt.service';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { HelperFunctionsService } from '../../core/helper-functions.service';

@Component({
  selector: 'app-pm-analyzer',
  templateUrl: './pm-analyzer.component.html',
  styleUrls: ['./pm-analyzer.component.scss']
})
export class PmAnalyzerComponent implements OnInit, OnDestroy {
  public particle_values = {
    '10': 0
  };
  public value_array = [];
  public value_arrays = {};
  pm10 = 0;

  latestmsg: String;

  private mqttRequest = {
    topic: '+/sensors/+/particulate_matter',
    tagFilters: undefined,
    valueFilters: [],
    callBack: (obj: Object) => this.update(obj)
  };
  constructor(
    private mqtt: MqttService,
    private globalSettings: GlobalSettingsService,
    private h: HelperFunctionsService
  ) {
    this.globalSettings.emitChange({ appName: 'PM-Analyzer' });
  }

  ngOnInit() {
    this.mqtt.request(this.mqttRequest);
  }
  ngOnDestroy() {
    this.mqtt.unsubscribeTopic(this.mqttRequest.topic);
  }

  update(msg: Object) {
    const values = this.h.getDeep(msg, ['values']);
    if (values) {
      this.latestmsg = JSON.stringify(msg, null, 2);

      const sortedValues = [];

      const sensor = msg['tags']['sensor'];

      this.pm10 = values['p10_ugpm3'];
      for (var key in values) {
        if (key.endsWith('_ppcm3')) {
          const marr = key.match(/p([0-9.]*)_ppcm3/) || [];
          if (!marr.length) {
            continue;
          }
          const size = marr[1];
          this.particle_values[size] = values[key];

          const sizeFloat = parseFloat(size);
          sortedValues.push({'size': sizeFloat, 'v': values[key]});
        }
      }
      sortedValues.sort((a, b) => a.size - b.size)
      // console.log(sortedValues);

      this.value_arrays[sensor] = sortedValues;

      // this.cleanInitValues();
      // this.dygData.push([new Date(msg['UTS'] * 1000), this.pm10]);
      // for (var key in this.particle_values) {
      //   const values_key = 'p' + key + '_ppcm3';
      //   if (values[values_key]) {
      //     this.particle_values[key] = values[values_key];
      //   }
      // }
      // this.triggerChange();
    }
  }
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

  public barChartOptions = {
    scaleShowVerticalLines: false,
    responsive: true
  };
  public barChartLabels = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
  public barChartType = 'bar';
  public barChartLegend = true;
  public barChartData = [
    {data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A'},
    {data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B'}
  ];
}
