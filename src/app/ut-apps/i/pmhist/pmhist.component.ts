import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';

@Component({
  selector: 'app-pmhist',
  templateUrl: './pmhist.component.html',
  styleUrls: ['./pmhist.component.scss']
})
export class PmhistComponent implements OnInit {
  sensorsEnabled = {
    'OPC-N3': true
    // SPS30: true
  };

  extraDyGraphConfig = {
    connectSeparatedPoints: true,
    pointSize: 3,
    series: {
      'sensor: OPC-N3, p10 (µg/m³)': {
        axis: 'y2'
      },
      'sensor: OPC-N3, p2.5 (µg/m³)': {
        axis: 'y2'
      },
      'sensor: OPC-N3, p1 (µg/m³)': {
        axis: 'y2'
      }
    },
    y2label: 'µg&#8202;/&#8202;m³',
    axes: {
      y2: {
        independentTicks: true,
        drawGrid: false
      }
    }
    // logscale: true
  };
  labelBlackListT = ['host', 'serial', 'particulate_matter', 'mean_*'];
  graphstyle = {
    position: 'absolute',
    top: '4em',
    bottom: '30%',
    left: '1rem',
    right: '15rem'
  };

  public startTime = '6h';
  public userStartTime = this.startTime;
  public meanS = 30;
  public userMeanS = this.meanS;
  db = 'envirograz000';
  server = 'https://newton.unraveltec.com';

  labels = [];
  data = [];

  appName = 'Particulate Matter Histogram';

  changeTrigger = true;

  barColors = '#00BBF2';
  borderColor = '#00ff00';
  chartColors = [{ backgroundColor: this.barColors }];
  public barChartLabels = [
    '0.46 µm',
    '0.66 µm',
    '1 µm',
    '1.3 µm',
    '1.7 µm',
    '2.3 µm',
    '3 µm',
    '4 µm',
    '5.2 µm',
    '6.5 µm',
    '8 µm',
    '10 µm',
    '12 µm',
    '14 µm',
    '16 µm',
    '18 µm',
    '20 µm',
    '22 µm',
    '25 µm',
    '28 µm',
    '31 µm',
    '34 µm',
    '37 µm',
    '40 µm'
  ];
  public barChartType = 'bar';
  public barChartLegend = true;
  public barChartData = [
    // { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' },
    { data: [1,0], label: 'OPC-N3' }
  ];
  public barChartOptions = {
    scaleShowVerticalLines: false,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      yAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: 'Particles / cm³'
          }
        }
      ]
    }
  };
  public particle_values = {
    '10': 0
  };

  constructor(
    private globalSettings: GlobalSettingsService,
    private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService,
    private h: HelperFunctionsService
  ) {
    this.globalSettings.emitChange({ appName: this.appName });
  }

  ngOnInit() {
    const lsMean = this.localStorage.get(this.appName + 'userMeanS');
    if (lsMean) {
      this.userMeanS = lsMean;
    }
    const lsStartTime = this.localStorage.get(this.appName + 'userStartTime');
    if (lsStartTime) {
      this.userStartTime = lsStartTime;
    }
    this.reload();
  }
  reload() {
    this.meanS = this.userMeanS;
    this.startTime = this.userStartTime;
    const ts = this.startTime;
    const mS = String(this.meanS);

    let pmquery = '';
    if (this.sensorsEnabled['OPC-N3'] || this.sensorsEnabled['SPS30']) {
      pmquery = 'SELECT mean(/_ppcm3|_ugpm3/) FROM particulate_matter WHERE ';

      let sensorw = '';
      if (!(this.sensorsEnabled['OPC-N3'] && this.sensorsEnabled['SPS30'])) {
        let s;
        for (s of ['OPC-N3', 'SPS30']) {
          if (this.sensorsEnabled[s]) {
            sensorw += (sensorw ? ' OR ' : '') + "sensor='" + s + "'";
          }
        }
      }

      pmquery +=
        (sensorw ? '(' + sensorw + ') AND ' : '') +
        'time > now() - ' +
        ts +
        ' GROUP BY sensor,host,time(' +
        mS +
        's);';
    }

    this.launchQuery(pmquery);
  }

  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);
    const widthPx = 1600;
    const divider = rangeSeconds / widthPx;
    if (divider > 1) {
      this.userMeanS = Math.floor(divider);
    }
    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
    this.localStorage.set(this.appName + 'userStartTime', this.userStartTime);
  }

  launchQuery(clause: string) {
    const q = this.utHTTP.buildInfluxQuery(clause, this.db, this.server);
    console.log('new query:', q);

    this.utHTTP
      // .getHTTPData(q)
      .getHTTPData(q, 'grazweb', '.RaVNaygexThM')
      .subscribe((data: Object) => this.handleData(data));
  }
  saveMean(param) {
    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
  }

  handleData(data: Object) {
    console.log('received', data);
    let ret = this.utHTTP.parseInfluxData(data, this.labelBlackListT);
    console.log('parsed', ret);
    this.labels = ret['labels'];
    this.data = ret['data'];
    // console.log(cloneDeep(this.dygLabels));
    this.startTime = this.userStartTime;
    // this.changeTrigger = !this.changeTrigger;
    if (this.data && this.data.length) {
      const points = []; // { yval: float, name: }
      const lastrow = this.data[this.data.length - 1];
      for (let i = 1; i < this.labels.length; i++) {
        // i=i because [0] is Date
        const label = this.labels[i];
        points.push({ name: label, yval: lastrow[i] });
      }
      this.handleHighlightCallback({
        seriesName: this.labels[1], // first non-date
        points: points
      });
    }
  }
  handleHighlightCallback(dataObj: Object) {
    // console.log(dataObj);
    if (!dataObj['seriesName']) {
      console.error('no seriesName');
      return;
    }
    const matchArr = dataObj['seriesName'].match(/sensor:(.*),/);
    if (!matchArr || !matchArr[1]) {
      console.error('no sensorname');
      return;
    }
    const sensor = matchArr[1];
    // console.log(sensor);

    const tmpBarChartLabels = [];
    let chartSeriesData = {
      data: [],
      label: sensor
    };
    const sortedValues = [];
    for (let i = 0; i < dataObj['points'].length; i++) {
      const element = dataObj['points'][i];
      const v = element['yval'];
      const nameArr = element['name'].match(/([0-9.]*) µm/) || [];
      if (!nameArr.length) {
        continue;
      }
      const size = parseFloat(nameArr[1]);
      sortedValues.push({ size: size, v: v });
    }
    sortedValues.sort((a, b) => a.size - b.size);

    for (let i = 0; i < sortedValues.length; i++) {
      const v = sortedValues[i];
      tmpBarChartLabels.push(String(v.size) + ' µm');
      chartSeriesData.data.push(v.v);
    }
    this.barChartLabels = tmpBarChartLabels;
    this.barChartData = [];
    this.barChartData.push(chartSeriesData);
  }
}
