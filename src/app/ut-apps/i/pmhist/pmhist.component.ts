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
    pointSize: 3
    // logscale: true
  };
  labelBlackListT = ['host', 'serial', 'particulate_matter'];
  graphstyle = {
    position: 'absolute',
    top: '4em',
    bottom: '30%',
    left: '0rem',
    right: '15rem'
  };

  public startTime = '6h';
  public userStartTime = this.startTime;
  public meanS = 13;
  public userMeanS = this.meanS;
  db = 'envirograz000';
  server = 'https://newton.unraveltec.com';

  public row1 = [new Date(new Date().valueOf() - 300100), 1]; //, null, null];
  public row2 = [new Date(new Date().valueOf() - 200000), 2]; // null, 1.2, 0.8];

  labels = ['Date', 'sensor1-val1'];
  data = [this.row1, this.row2];

  appName = 'Particulate Matter Histogram';

  changeTrigger = true;

  barColors = '#00BBF2';
  borderColor = '#00ff00';
  chartColors = [{ backgroundColor: this.barColors }];
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
    { data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B' }
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
  }
  handleHighlightCallback(dataObj: Object) {
    console.log(dataObj);
    if (!dataObj['seriesName']) {
      console.error('no seriesName');
      return;
    }
    const matchArr = dataObj['seriesName'].match(/sensor:(.*),/);
    if (!matchArr[1]) {
      console.error('no sensorname');
      return;
    }
    const sensor = matchArr[1];
    console.log(sensor);

    const tmpBarChartLabels = [];
    let chartSeriesData = {
      data: [],
      label: sensor
    };
    const sortedValues = [];
    for (let i = 0; i < dataObj['points'].length; i++) {
      const element = dataObj['points'][i];
      const v = element['yval'];
      const nameArr = element['name'].match(/p([0-9.]*)_ppcm3/) || [];
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

  updateBarChart(msg: Object) {
    const sensor = msg['tags']['sensor'];
    const values = msg['values'];
    const sortedValues = [];
    const tmpbarChartData = [];

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
    let chartSeriesData = {
      data: [],
      label: sensor
    };
    for (let i = 0; i < sortedValues.length; i++) {
      const v = sortedValues[i];
      this.barChartLabels.push(String(v.size) + ' µm');
      chartSeriesData.data.push(v.v);
    }
    tmpbarChartData.push(chartSeriesData);
    this.barChartData = tmpbarChartData;
    // this.latestmsg = JSON.stringify(this.barChartData, null, 2);
  }
}
