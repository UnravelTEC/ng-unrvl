import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-luftdaten',
  templateUrl: './luftdaten.component.html',
  styleUrls: ['./luftdaten.component.scss']
})
export class LuftdatenComponent implements OnInit {
  colorMappings = {
    temperature: 'red',
    humidity: 'blue',
    pressure: 'green',
    SDS011: 'brown'
  };

  colors = [];
  graphWidth = 1500;
  setGraphWidth(width) {
    this.graphWidth = width;
    console.log('new w', width);
  }

  extraDyGraphConfig = {
    connectSeparatedPoints: true,
    pointSize: 3,
    logscale: false,
    series: {
      'BME280 (pressure)': {
        axis: 'y2'
      }
    },
    y2label: 'Atmospheric Pressure (hPa)',
    axes: {
      y2: {
        independentTicks: true,
        axisLabelWidth: 60,
      }
    }
  };
  labelBlackListT = ['particulate_matter', 'mean_*']; // ['host', 'serial', 'mean_*'];
  graphstyle = {
    position: 'absolute',
    top: '0.5em',
    bottom: '0.5rem',
    left: '0.5rem',
    right: '15rem'
  };

  public startTime = '7d';
  public userStartTime = this.startTime;
  public meanS = 300;
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
  db = 'luftdaten';
  server = 'https://newton.unraveltec.com';

  labels = [];
  data = [];

  appName = 'Luftdaten Sensor Node';

  changeTrigger = true;
  constructor(
    private globalSettings: GlobalSettingsService,
    private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService,
    private h: HelperFunctionsService,
    private router: ActivatedRoute
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
  reload(fromTo = false) {
    this.meanS = this.userMeanS;
    this.startTime = this.userStartTime;

    const timeQuery = fromTo
      ? this.utHTTP.influxTimeString(this.fromTime, this.toTime)
      : this.utHTTP.influxTimeString(this.startTime);

    let queries = this.utHTTP.influxMeanQuery(
      'particulate_matter',
      timeQuery,
      {},
      this.meanS,
      '/BME|SDS/'
    );

    if (queries) this.launchQuery(queries);
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
    if (!this.globalSettings.server.influxdb) {
      console.log('db not yet set, wait');
      setTimeout(() => {
        this.launchQuery(clause);
      }, 1000);
      return;
    }
    const q = this.utHTTP.buildInfluxQuery(clause, this.db, this.server);
    this.utHTTP
      // .getHTTPData(q)
      .getHTTPData(q, 'luftweb', 'YQ9xYNKWk4Pqkmr0')
      .subscribe((data: Object) => this.handleData(data),
      (error) => this.globalSettings.displayHTTPerror(error));
  }
  saveMean(param) {
    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
  }
  handleData(data: Object) {
    console.log('received', data);
    let ret = this.utHTTP.parseInfluxData(data, this.labelBlackListT);
    if (ret['error']) {
      alert('Influx Error: ' + ret['error']);
      return;
    }
    console.log('parsed', ret);
    const labels = ret['labels'];
    const idata = ret['data'];
    for (let c = 1; c < labels.length; c++) {
      const item = labels[c];
      if (item.match(/pressure/)) {
        for (let r = 0; r < idata.length; r++) {
          idata[r][c] /= 100;
        }
      }
      if (item.match(/P1/)) {
        labels[c] = item.replace(/P1/, 'PM10').replace(/SDS/, 'SDS011');
      }
      if (item.match(/P2/)) {
        labels[c] = item.replace(/P2/, 'PM2.5').replace(/SDS/, 'SDS011');
      }
    }
    this.colors = this.h.getColorsforLabels(labels, this.colorMappings);
    this.startTime = this.userStartTime;
    this.labels = labels;
    this.data = idata;
    console.log(labels);
    console.log(idata);
  }
}
