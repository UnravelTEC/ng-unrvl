import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';
import { cpuUsage } from 'process';

@Component({
  selector: 'app-pmhist',
  templateUrl: './pmhist.component.html',
  styleUrls: ['./pmhist.component.scss'],
})
export class PmhistComponent implements OnInit {
  sensorsEnabled = {
    'OPC-N3': true,
    // SPS30: true
  };

  extraDyGraphConfig = {
    connectSeparatedPoints: true,
    pointSize: 3,
    series: {
      'sensor: OPC-N3, pm10 (µg/m³)': {
        axis: 'y2',
      },
      'sensor: OPC-N3, pm2.5 (µg/m³)': {
        axis: 'y2',
      },
      'sensor: OPC-N3, pm1 (µg/m³)': {
        axis: 'y2',
      },
    },
    y2label: 'Particulate Mass (&#8202;µg&#8202;/&#8202;m³&#8202;)',
    axes: {
      y2: {
        independentTicks: true,
        // note: do not use log scale, dygraph does return only displayed data (no values == 0)
      },
    },
  };
  labelBlackListT = ['host', 'serial', 'particulate_matter', 'mean_*'];
  graphstyle = {
    position: 'absolute',
    top: '4em',
    bottom: '30%',
    left: '1rem',
    right: '15rem',
  };

  public startTime = '6h';
  public userStartTime = this.startTime;
  public meanS = 30;
  public userMeanS = this.meanS;
  public fromTime: Date;
  public toTime: Date;
  public currentRange: string;
  updateFromToTimes(timearray) {
    // console.log(timearray);
    this.fromTime = new Date(timearray[0]);
    this.toTime = new Date(timearray[1]);
    const rangeSeconds = Math.floor((timearray[1] - timearray[0]) / 1000);
    this.currentRange = this.h.createHRTimeString(rangeSeconds);
    this.userMeanS = this.calcMean(rangeSeconds);
  }
  graphWidth = 1500;
  setGraphWidth(width) {
    this.graphWidth = width;
    console.log('new w', width);
  }
  currentres = 0;

  db = 'envirograz000';
  server = 'https://newton.unraveltec.com';

  labels = [];
  data = [];
  maxVal = 0;

  appName = 'Particulate Matter Histogram';

  changeTrigger = true;

  barColors = '#00BBF2';
  borderColor = '#00ff00';
  chartColors = [{ backgroundColor: [] }];
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
    '40 µm',
    '',
  ];
  public barChartType = 'bar';
  public barChartLegend = true;
  public barChartData = [
    // { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' },
    { data: [1, 0], label: 'OPC-N3' },
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
            labelString: 'Particles / cm³',
          },
        },
      ],
    },
  };
  public particle_values = {
    '10': 0,
  };

  constructor(
    private globalSettings: GlobalSettingsService,
    private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService,
    public h: HelperFunctionsService
  ) {
    this.globalSettings.emitChange({ appName: this.appName });
    for (let i = 0; i < 24; i++) {
      this.chartColors[0].backgroundColor.push(this.barColors);
    }
    this.chartColors[0].backgroundColor.push('rgba(255, 255, 255, 0)');
  }

  ngOnInit() {
    this.globalSettings.emitChange({ fullscreen: true });
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
  reload(fromTo = false) {
    this.meanS = this.userMeanS;
    this.startTime = this.userStartTime;

    const timeQuery = fromTo
      ? this.utHTTP.influxTimeString(this.fromTime, this.toTime)
      : this.utHTTP.influxTimeString(this.startTime);

    this.launchQuery(
      this.utHTTP.influxMeanQuery(
        'particulate_matter',
        timeQuery,
        { sensor: ['OPC-N3'] },
        this.meanS,
        '/_ppcm3|_ugpm3/'
      )
    );
    this.currentres = this.meanS;
  }
  calcMean(secondsRange) {
    const divider = Math.floor(secondsRange / this.graphWidth);
    return divider > 30 ? divider : 30;
  }
  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);
    this.userMeanS = this.calcMean(rangeSeconds);
    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
    this.localStorage.set(this.appName + 'userStartTime', this.userStartTime);
    this.reload();
  }

  launchQuery(clause: string) {
    if (!this.globalSettings.influxReady()) {
      setTimeout(() => {
        this.launchQuery(clause);
      }, 1000);
      return;
    }

    const q = this.utHTTP.buildInfluxQuery(clause);
    this.utHTTP.getHTTPData(q).subscribe(
      (data: Object) => this.handleData(data),
      (error) => this.globalSettings.displayHTTPerror(error)
    );
  }
  setAvg(t) {
    this.userMeanS = t;
    this.saveMean(t);
  }
  saveMean(param) {
    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
  }

  handleData(data: Object) {
    console.log('received', data);
    let ret = this.utHTTP.parseInfluxData(data, this.labelBlackListT);
    // console.log('parsed', ret);
    if (ret['error']) {
      alert('Influx Error: ' + ret['error']);
      return;
    }

    // custom sort
    const oldLabels = ret['labels'];

    const pms = [];
    const pns = [];
    for (let i = 1; i < oldLabels.length; i++) {
      const label = oldLabels[i];

      let match = label.match(/([0-9.]*) µm/) || [];
      if (match.length > 1) {
        const size = parseFloat(match[1]);
        // console.log('found pn', size, '@', i);
        pns.push({ size: size, index: i });
        continue;
      }
      match = label.match(/pm([0-9.]*) \(µg\/m³/) || [];
      if (match.length > 1) {
        const size = parseFloat(match[1]);
        // console.log('found pm', size, '@', i);
        pms.push({ size: size, index: i });
      }
    }
    pms.sort((a, b) => a.size - b.size);
    // console.log("pm's", pms);
    pns.sort((a, b) => a.size - b.size);
    // console.log("pn's", pns);
    const newOrder = [NaN].concat(pms, pns);
    // console.log('newOrder', newOrder);
    const newLabels = [oldLabels[0]]; // Date stays
    const newIndices = [0];
    for (let c = 1; c < newOrder.length; c++) {
      const index = newOrder[c]['index'];
      newLabels.push(oldLabels[index]);
      newIndices.push(index);
    }
    // console.log('newLabels', newLabels);
    const oldData = ret['data'];
    const newData = [];
    for (let rowindex = 0; rowindex < oldData.length; rowindex++) {
      const oldRow = oldData[rowindex];
      const newRow = [];
      for (let c = 0; c < newIndices.length; c++) {
        const index = newIndices[c];
        newRow.push(oldRow[index]);
      }
      newData.push(newRow);
    }

    this.labels = newLabels;
    this.data = newData;
    // console.log(cloneDeep(this.dygLabels));
    this.startTime = this.userStartTime;
    if (this.data && this.data.length) {
      const points = []; // { yval: float, name: }
      const lastrow = this.data[this.data.length - 1];
      for (let i = 1; i < this.labels.length; i++) {
        // i=i because [0] is Date
        const label = this.labels[i];
        points.push({ name: label, yval: lastrow[i] });
      }
      // search for p-count maximum
      const pnRows = [];
      for (let i = 0; i < this.labels.length; i++) {
        const valueLabel = this.labels[i];
        if ((valueLabel.match(/([0-9.]*) µm/) || []).length) {
          pnRows.push(true);
        } else {
          pnRows.push(false);
        }
      }
      for (let datarow = 0; datarow < this.data.length; datarow++) {
        const rowvalues = this.data[datarow];
        for (let i = 0; i < pnRows.length; i++) {
          if (pnRows[i]) {
            const v = rowvalues[i];
            if (v > this.maxVal) {
              this.maxVal = v;
            }
          }
        }
      }
      console.log('maxVal:', this.maxVal);
      this.handleHighlightCallback({
        seriesName: this.labels[1], // first non-date
        points: points,
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
      label: sensor,
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
    tmpBarChartLabels.push('');
    chartSeriesData.data.push(this.maxVal);
    this.barChartLabels = tmpBarChartLabels;
    this.barChartData = [];
    this.barChartData.push(chartSeriesData);
  }
  showVisible() {
    const fromStamp = this.fromTime.valueOf();
    const toStamp = this.toTime.valueOf();
    console.log('from', fromStamp, 'to', toStamp);
    
    let chartSeriesData = {
      data: [],
      label: 'Visible Dataset',
    };
    const columnsToUse = []; // [ { size: x, c: n }, ... ] c: column
    for (let i = 1; i < this.labels.length; i++) {
      const label = this.labels[i];
      const matchArr = label.match(/([0-9.]*) µm/) || [];
      if (!matchArr.length) {
        continue;
      }
      const size = parseFloat(matchArr[1]);
      columnsToUse.push({size: size, c: i});
      chartSeriesData.data.push(0);
    }
    columnsToUse.sort((a, b) => a.size - b.size);
    console.log(columnsToUse);
    

    for (let ti = 0; ti < this.data.length; ti++) {
      const row = this.data[ti];
      const ts = row[0].valueOf();
      if(ts < fromStamp || ts > toStamp) {
        continue;
      }
      for (let c = 0; c < columnsToUse.length; c++) {
        const col = columnsToUse[c];
        chartSeriesData.data[c] += row[col['c']]
      }
    }
    chartSeriesData.data.push(this.maxVal);
    this.barChartData = [];
    this.barChartData.push(chartSeriesData);
  }
}
