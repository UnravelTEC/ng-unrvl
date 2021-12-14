import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';
import { ActivatedRoute } from '@angular/router';
import { cloneDeep } from 'lodash-es';
import { SensorService } from 'app/shared/sensor.service';

@Component({
  selector: 'app-anysens',
  templateUrl: './anysens.component.html',
  styleUrls: ['./anysens.component.scss'],
})
export class AnysensComponent implements OnInit {
  colors = [];
  graphWidth = 1500;
  setGraphWidth(width) {
    this.graphWidth = width;
    console.log('new w', width);
  }

  extraDyGraphConfig = {
    // connectSeparatedPoints: true,
    pointSize: 3,
    logscale: false,
    series: {
      'pressure sensor: BME280, pressure (hPa)': {
        axis: 'y2',
      },
    },

    axes: {
      y2: {
        independentTicks: true, // default opt here to have a filled object to access later
        // axisLabelWidth: 60, // set on demand
      },
    },
  };
  y2label = 'Atmospheric Pressure';
  labelBlackListT = ['mean_*']; // mean is when only 1 graph is returned
  private sidebarWidth = '15rem';
  public currentSidebarWidth = this.sidebarWidth;
  graphstyle = {
    position: 'absolute',
    top: '0.5em',
    bottom: '0.5rem',
    left: '0.5rem',
    right: '0.5rem',
  };

  public startTime = '6h';
  public dygStartTime: string; // used on autoUpdate
  public userStartTime = this.startTime;
  public meanS = 30;
  public currentres = 0;
  public currentresText = '0s';
  public userMeanS = this.meanS;
  public fromTime: Date;
  public toTime: Date;
  public currentRange: string;
  updateFromToTimes(timearray, interval = '') {
    // console.log(timearray);
    this.fromTime = new Date(timearray[0]);
    this.from = timearray[0];
    this.toTime = new Date(timearray[1]);
    this.to = timearray[1];
    const rangeSeconds = Math.floor((timearray[1] - timearray[0]) / 1000);
    this.currentRange = this.h.createHRTimeString(rangeSeconds);
    if (!interval) {
      this.userMeanS = this.calcMean(rangeSeconds);
      this.interval = String(this.userMeanS);
    } else {
      this.userMeanS = Number(interval);
    }
  }

  labels = [];
  data = [];
  orig_labels = [];
  common_label = '';
  short_labels: string[] = [];
  latest_dates = [];
  latest_values = [];
  raw_labels = [];
  round_digits = [0];
  show_deviation = true;

  public allAverages = [];
  public visibleAverages = [];

  appName = 'Any Sens';

  changeTrigger = true;

  measurement = 'temperature';
  ylabel = '';
  sensor: String;
  id: String;
  interval: string;
  background: string;
  host = '';
  value = '*';
  referrer = 'Allsens';
  public from: Number; // unix time from urlparam
  public to: Number; // unix time from urlparam

  public queryRunning = false;

  public autoreload = false;
  public auto_interval = 1; // gets set to userMeanS
  public reload_timer = Infinity;
  public last_reload: number;

  public tableShown = true;
  public sideBarShown = true;

  constructor(
    public gss: GlobalSettingsService,
    private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService,
    private h: HelperFunctionsService,
    private router: ActivatedRoute,
    private sensorService: SensorService
  ) {
    this.gss.emitChange({ appName: this.appName });
  }

  ngOnInit() {
    [
      'userMeanS',
      'userStartTime',
      'tableShown',
      'sideBarShown',
      'show_deviation',
    ].forEach((element) => {
      const thing = this.localStorage.get(this.appName + element);
      if (thing !== null) {
        this[element] = thing;
      }
    });
    this.currentSidebarWidth = this.sideBarShown ? this.sidebarWidth : '0rem';
    this.auto_interval = this.userMeanS;
    this.reload_timer = this.auto_interval;

    [
      'host',
      'measurement',
      'sensor',
      'background',
      'referrer',
      'from',
      'to',
      'id',
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
    this.ylabel = this.measurement
      .replace('pressure', '')
      .replace(',,', ',')
      .replace(',', ', ');
    const ylabel = this.router.snapshot.queryParamMap.get('ylabel');
    if (ylabel) {
      this.ylabel = ylabel;
    }

    if (this.from && this.to) {
      this.from = Number(this.from);
      this.to = Number(this.to);
      this.updateFromToTimes([this.from, this.to], this.interval);
      this.reload(true);
    } else {
      this.reload();
    }
  }

  reload(fromTo = false) {
    this.meanS = this.userMeanS;
    this.currentres = this.meanS;
    this.currentresText = this.h.createHRTimeString(this.meanS);
    this.startTime = this.userStartTime;
    this.dygStartTime = fromTo ? undefined : this.startTime;

    const timerange = fromTo
      ? (this.toTime.valueOf() - this.fromTime.valueOf()) / 1000
      : this.h.parseToSeconds(this.startTime);
    const nr_points = timerange / this.meanS;
    if (nr_points > 10000 && !this.h.bigQconfirm(nr_points)) {
      if (!this.labels.length) {
        // at start to show "no data"
        this.labels = [''];
      }
      return;
    }
    this.queryRunning = true;

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
    if (this.id) {
      params['id'] = this.id;
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
  changeAutoS(param) {
    console.log(param);

    if (!this.autoreload) {
      this.reload_timer = param;
    }
  }

  toggleAutoReload(param) {
    console.log('autoreload:', this.autoreload);

    if (this.autoreload) {
      if (this.gss.server.protocol == 'https' && this.auto_interval < 5 * 60) {
        if (
          !confirm(
            "autoreload < 180s do not make sense on public server, as DB doesn't get updated this often - are you sure?"
          )
        ) {
          setTimeout(() => {
            this.autoreload = false;
          }, 50);
          return;
        }
      }
      this.last_reload = new Date().valueOf() / 1000;
      setTimeout(() => this.updateReloadTimer(), 1000);
      setTimeout(() => {
        if (this.autoreload) {
          this.reload();
        }
      }, this.auto_interval * 1000);
    }
  }

  updateReloadTimer() {
    if (this.autoreload) {
      const now_utime = new Date().valueOf() / 1000;
      const remaining = Math.round(
        this.last_reload + Number(this.auto_interval) - now_utime
      );
      this.reload_timer = remaining > 0 ? remaining : 0;
      // console.log(this.last_reload, this.auto_interval, now_utime);

      setTimeout(() => this.updateReloadTimer(), 1000);
    }
  }

  calcMean(secondsRange) {
    const divider = Math.floor(secondsRange / this.graphWidth);
    return divider > 1 ? divider : 1;
  }
  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);

    this.userMeanS = this.calcMean(rangeSeconds);
    this.auto_interval = this.userMeanS;
    this.reload_timer = this.auto_interval;

    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
    this.localStorage.set(this.appName + 'userStartTime', this.userStartTime);
    this.reload();
  }

  toggleTableShown() {
    this.tableShown = !this.tableShown;
    this.changeTrigger = !this.changeTrigger;
    this.changeTrigger = !this.changeTrigger;
    this.localStorage.set(this.appName + 'tableShown', this.tableShown);
    console.log(
      'toggleTableShown',
      this.tableShown,
      'LS after:',
      this.localStorage.get(this.appName + 'tableShown')
    );
  }
  toggleSidebar() {
    this.sideBarShown = !this.sideBarShown;
    this.currentSidebarWidth = this.sideBarShown ? this.sidebarWidth : '0rem';
    this.changeTrigger = !this.changeTrigger;
    this.changeTrigger = !this.changeTrigger;

    this.localStorage.set(this.appName + 'sideBarShown', this.sideBarShown);
    console.log('toggleSidebar', this.currentSidebarWidth);
  }

  launchQuery(clause: string) {
    if (!this.gss.influxReady()) {
      setTimeout(() => {
        this.launchQuery(clause);
      }, 1000);
      return;
    }
    this.utHTTP.getHTTPData(this.utHTTP.buildInfluxQuery(clause)).subscribe(
      (data: Object) => this.handleData(data),
      (error) => {
        this.queryRunning = false;
        this.gss.displayHTTPerror(error);
      }
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
      this.autoreload = false;
      return;
    }
    const labels = ret['labels'];
    const idata = ret['data'];
    this.orig_labels = cloneDeep(ret['labels']);
    this.short_labels = ret['short_labels'];
    this.common_label = ret['common_label'];
    this.raw_labels = ret['raw_labels'];
    console.log('orig labels:', this.orig_labels);
    console.log('raw labels:', ret['raw_labels']);
    console.log('common_label:', ret['common_label']);
    console.log('short_labels:', ret['short_labels']);

    let logscale = true;
    const newColors = this.h.getColorsforLabels(labels);
    const numColumns = labels.length;
    for (let c = 1; c < numColumns; c++) {
      const item = labels[c];

      if (logscale == true) {
        for (let r = 0; r < idata.length; r++) {
          const point = idata[r][c];
          if (point <= 0 && point !== NaN && point !== null) {
            logscale = false;
            console.log('found', idata[r][c], '@r', r, 'c', c, 'of', item);
            break;
          }
        }
      }
      // NO2: ppm -> ppb
      if (item.match(/NO₂ \(ppm\)/)) {
        labels[c] = item.replace(/ppm/, 'ppb');
        for (let r = 0; r < idata.length; r++) {
          idata[r][c] *= 1000;
        }
      }
      if (item.match(/NO₂ \(µg\/m³\)/)) {
        for (let r = 0; r < idata.length; r++) {
          idata[r][c] = this.h.smoothNO2(idata[r][c]);
        }
      }
      if (item.match(/hPa/)) {
        this.extraDyGraphConfig.axes.y2['axisLabelWidth'] = 60;
        this.extraDyGraphConfig.series[this.short_labels[c - 1]] = {
          axis: 'y2',
        };
      }
      this.round_digits.push(this.sensorService.getDigits(this.raw_labels[c]));
    }
    // console.log(cloneDeep(this.dygLabels));
    if (logscale) {
      console.log('scale: log');
      this.extraDyGraphConfig.logscale = logscale;
    } else {
      console.log('scale: lin');
    }

    this.startTime = this.userStartTime;
    const newLabels = ['Date'];
    newLabels.concat(this.short_labels);
    this.labels = ['Date'].concat(this.short_labels);
    this.data = idata;
    this.colors = newColors;
    console.log(labels);
    console.log(idata);
    this.changeTrigger = !this.changeTrigger;
    this.changeTrigger = !this.changeTrigger;
    this.queryRunning = false;

    if (!this.data || !this.data[0]) {
      return;
    }
    for (let column = 1; column < numColumns; column++) {
      for (let i = idata.length - 1; i != 0; i--) {
        const element = idata[i][column];
        if (typeof element === 'number') {
          this.latest_values[column - 1] = this.h.roundAccurately(
            element,
            this.round_digits[column]
          );
          this.latest_dates[column - 1] = idata[i][0];
          break;
        }
      }
    }
    console.log('latest_values', this.latest_values);
    console.log('latest_dates', this.latest_dates);
    this.last_reload = new Date().valueOf() / 1000;
    if (this.autoreload) {
      setTimeout(() => {
        if (this.autoreload) {
          this.reload();
        }
      }, this.auto_interval * 1000);
    }
  }
  handleRunningAvg(dataObj: Object) {
    this.allAverages = dataObj['all'];
    this.visibleAverages = dataObj['visible'];
  }
}
