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
    this.update(this.testResult);
  }
  ngOnDestroy() {
    this.mqtt.unsubscribeTopic(this.mqttRequest.topic);
  }

  update(msg: Object) {
    const values = this.h.getDeep(msg, ['values']);
    if (values) {
      this.latestmsg = JSON.stringify(msg, null, 2);
      this.updateBarChart(msg);
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
          sortedValues.push({ size: sizeFloat, v: values[key] });
        }
      }
      sortedValues.sort((a, b) => a.size - b.size);
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

  updateBarChart(msg: Object) {
    const sensor = msg['tags']['sensor'];
    const values = msg['values'];
    const sortedValues = [];

    for (var key in values) {
      if (key.endsWith('_ppcm3')) {
        const marr = key.match(/p([0-9.]*)_ppcm3/) || [];
        if (!marr.length) {
          continue;
        }
        const size = marr[1];
        this.particle_values[size] = values[key];

        const sizeFloat = parseFloat(size);
        sortedValues.push({ size: sizeFloat, v: values[key] });
      }
    }
    sortedValues.sort((a, b) => a.size - b.size);
    this.barChartLabels = [];
    this.barChartData = [];
    let chartSeriesData = { data: [], label: sensor, backgroundColor: '#00aa00', borderColor:'#00ff00' }; // 'rgba(0,0,1,0.5)' };
    for (let i = 0; i < sortedValues.length; i++) {
      const v = sortedValues[i];
      this.barChartLabels.push(String(v.size) + ' µm');
      chartSeriesData.data.push(v.v);
    }
    this.barChartData.push(chartSeriesData);
    // this.latestmsg = JSON.stringify(chartSeriesData, null, 2);
  }

  public barChartOptions = {
    scaleShowVerticalLines: false,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      yAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: 'Particles / s'
          }
        }
      ]
    }
  };
  public barChartLabels = [
    '2006',
    '2007',
    '2008',
    '2009',
    '2010',
    '2011',
    '2012'
  ];
  public barChartType = 'bar';
  public barChartLegend = true;
  public barChartData = [
    // { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' },
    { data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B'}
  ];
  private testResult = {
    tags: {
      id: 'spi3-0',
      firmware_ver: '1.17',
      channels: 24,
      interval_s: 2,
      sensor: 'OPC-N3'
    },
    values: {
      sensor_degC: 27.594,
      humidity_rel_percent: 20.871,
      p1_ugpm3: 0.338,
      'p2.5_ugpm3': 0.486,
      p10_ugpm3: 0.492,
      'p0.46_ppcm3': 14.4935,
      'p0.66_ppcm3': 26.7,
      p1_ppcm3: 22,
      'p1.3_ppcm3': 17.778,
      'p1.7_ppcm3': 14.454,
      'p2.3_ppcm3': 14.31,
      p3_ppcm3: 10.4,
      p4_ppcm3: 7.75,
      'p5.2_ppcm3': 4.32,
      'p6.5_ppcm3': 3.32,
      p8_ppcm3: 3.54,
      p10_ppcm3: 2.54,
      p12_ppcm3: 1.73,
      p14_ppcm3: 0.7,
      p16_ppcm3: 0.54,
      p18_ppcm3: 0.32,
      p20_ppcm3: 0.22,
      p22_ppcm3: 0.05,
      p25_ppcm3: 0.001,
      p28_ppcm3: 0,
      p31_ppcm3: 0,
      p34_ppcm3: 0,
      p37_ppcm3: 0,
      p40_ppcm3: 0
    },
    UTS: 1573203513.031,
    topic: 'envirograz000/sensors/OPC-N3/particulate_matter'
  };
}
