import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GlobalSettingsService } from 'app/core/global-settings.service';
import { HelperFunctionsService } from 'app/core/helper-functions.service';
import { LocalStorageService } from 'app/core/local-storage.service';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';

@Component({
  selector: 'app-co2',
  templateUrl: './co2.component.html',
  styleUrls: ['./co2.component.scss'],
})
export class Co2Component implements OnInit {
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
    strokeWidth: 2,
  };
  labelBlackListT = ['host', 'serial', 'mean_*', 'id', 'mean'];
  graphstyle = {
    position: 'absolute',
    top: '0.5em',
    bottom: '0.5em',
    left: '0.5rem',
    right: '15rem',
  };

  public startTime = '6h';
  public userStartTime = this.startTime;
  public meanS = 30;
  public currentres = 0;
  public userMeanS = this.meanS;
  public fromTime: Date;
  public toTime: Date;
  public currentRange: string;

  labels = [];
  raw_labels = [];
  data = [];

  appName = 'CO2-Graph';

  changeTrigger = 0;

  measurement = 'gas';
  sensor: String;
  interval: string;
  host = '';
  value = '/CO2_ppm/';
  referrer = 'CO2';
  public from: number; // unix time from urlparam
  public to: number; // unix time from urlparam

  public queryRunning = false;

  constructor(
    public globalSettings: GlobalSettingsService,
    private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService,
    public h: HelperFunctionsService,
    private router: ActivatedRoute
  ) {
    this.globalSettings.emitChange({ appName: 'CO₂' });
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

    [
      'host',
      'measurement',
      'sensor',
      'referrer',
      'from',
      'to',
      'value',
      'interval',
    ].forEach((element) => {
      const thing = this.router.snapshot.queryParamMap.get(element);
      if (thing) {
        //   if (thing.search(',') > -1) {
        //     this[element] = thing.split(',');
        //   }
        this[element] = thing;
      }
    });

    if (this.from && this.to) {
      this.from = Number(this.from);
      this.to = Number(this.to);
      this.h.updateFromToTimes([this.from, this.to], this, this.interval);
      this.reload(true);
    } else {
      this.reload();
    }
  }

  reload(fromTo = false) {
    this.meanS = this.userMeanS;
    this.currentres = this.meanS;
    this.startTime = this.userStartTime;

    const timeQuery = fromTo
      ? this.utHTTP.influxTimeString(this.fromTime, this.toTime)
      : this.utHTTP.influxTimeString(this.startTime);

    let params = { sensor: [] };
    if (this.sensor) {
      if (Array.isArray(this.sensor)) {
        params['sensor'] = this.sensor;
      } else {
        params['sensor'] = [this.sensor];
      }
    }
    if (this.host) {
      params['host'] = this.host;
    }

    const queries = this.utHTTP.influxMeanQuery(
      this.measurement,
      timeQuery,
      params,
      this.meanS,
      this.value
    );

    this.launchQuery(queries);
  }

  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);

    this.userMeanS = this.h.calcMean(rangeSeconds, this.graphWidth);

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
    this.queryRunning = true;
    this.utHTTP.getHTTPData(this.utHTTP.buildInfluxQuery(clause)).subscribe(
      (data: Object) => this.handleData(data),
      (error) => this.globalSettings.displayHTTPerror(error)
    );
  }
  saveMean(param) {
    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
  }

  handleData(data: Object) {
    console.log('received', data);
    let ret = this.utHTTP.parseInfluxData(data, this.labelBlackListT);
    console.log('parsed', ret);
    if (ret['error']) {
      alert('Influx Error: ' + ret['error']);
      this.queryRunning = false;
      return;
    }
    const labels = ret['labels'];
    const idata = ret['data'];

    let logscale = true;
    const newColors = this.h.getColorsforLabels(labels);
    for (let c = 1; c < labels.length; c++) {
      const item = labels[c];

      if (logscale == true) {
        for (let r = 0; r < idata.length; r++) {
          const point = idata[r][c];
          if (point <= 0 && !Number.isNaN(point) && point !== null) {
            logscale = false;
            console.log('found', idata[r][c], '@r', r, 'c', c, 'of', item);
            break;
          }
        }
      }
      // NO2: ppm -> ppb
    }
    // console.log(cloneDeep(this.dygLabels));
    if (logscale) {
      console.log('scale: log');
      this.extraDyGraphConfig.logscale = logscale;
    } else {
      console.log('scale: lin');
    }
    this.startTime = this.userStartTime;
    this.labels = labels;
    this.raw_labels = ret['raw_labels'];
    this.data = idata;
    this.colors = newColors;
    console.log(labels);
    console.log(idata);
    this.changeTrigger += 1;
    this.queryRunning = false;
  }
}
