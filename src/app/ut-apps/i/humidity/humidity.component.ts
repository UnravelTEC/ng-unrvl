//
// Ziele:
// Absolute humidity anzeigein für jeden rH-Sensor
// Taupunkt für jeden rH-Sensor
// Referenz-T-Sensor angebbar (optional)

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { cloneDeep } from 'lodash-es';
import { SensorService } from 'app/shared/sensor.service';

@Component({
  selector: 'app-humidity',
  templateUrl: './humidity.component.html',
  styleUrls: ['./humidity.component.scss'],
})
export class HumidityComponent implements OnInit {
  appName = 'Humidity';
  measurement = 'humidity';

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
  labelBlackList = ['mean_*']; // mean is when only 1 graph is returned
  public taglist = {}; // tagkey: true/false
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


  changeTrigger = 0;

  ylabel = '';
  sensor: String;
  ref_tsensor: String;
  ref_tid: String;
  ref_tfield = "*";
  id: String;
  interval: string;
  background: string;
  host = '';
  value = '*';
  referrer = 'Allsens';
  public from: number; // unix time from urlparam
  public to: number; // unix time from urlparam

  public queryRunning = false;

  public autoreload = false;
  public auto_interval = 1; // gets set to userMeanS
  public reload_timer = Infinity;
  public last_reload: number;

  public tableShown = true;
  public sideBarShown = true;
  public tagsShown = true;

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
      'tagsShown',
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

    const lstaglist = this.localStorage.get(this.appName + 'taglist');
    for (const key in lstaglist) {
      if (Object.prototype.hasOwnProperty.call(lstaglist, key)) {
        this.taglist[key] = lstaglist[key];
      }
    }
    for (const key in this.taglist) {
      if (Object.prototype.hasOwnProperty.call(this.taglist, key)) {
        if (this.taglist[key] === false) {
          this.labelBlackList.push(key);
        }
      }
    }

    [
      'host',
      'sensor',
      'ref_tsensor',
      'ref_tid',
      'ref_tfield',
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
        this[element] = thing;
      }
    });
    this.gss.emitChange({ appName: this.measurement + (this.sensor ? ' ' + this.sensor : '') });

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

    let queries = this.utHTTP.influxMeanQuery(
      this.measurement,
      timeQuery,
      params,
      this.meanS,
      this.value
    );
    params = { sensor: [] };
    if (this.ref_tsensor) {
      if (Array.isArray(this.ref_tsensor)) {
        params['sensor'] = this.ref_tsensor;
      } else {
        params['sensor'] = [this.ref_tsensor];
      }
    }
    if (this.host) {
      params['host'] = this.host;
    }
    if (this.ref_tid) {
      params['id'] = this.ref_tid;
    }
    queries += this.utHTTP.influxMeanQuery(
      "temperature",
      timeQuery,
      params,
      this.meanS,
      this.ref_tfield
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
  changeTaglist(param) {
    this.localStorage.set(this.appName + 'taglist', this.taglist)
    // console.log(this.taglist);
    for (const key in this.taglist) {
      if (Object.prototype.hasOwnProperty.call(this.taglist, key)) {
        if (this.taglist[key] === false) {
          if (!this.labelBlackList.includes(key)) {
            this.labelBlackList.push(key);
          }
        } else {
          if (this.labelBlackList.includes(key)) {
            this.labelBlackList.splice(this.labelBlackList.indexOf(key), 1);
          }
        }
      }
    }
  }

  toggleTableShown() {
    this.tableShown = !this.tableShown;
    this.changeTrigger += 1;
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
    this.changeTrigger += 1;

    this.localStorage.set(this.appName + 'sideBarShown', this.sideBarShown);
    console.log('toggleSidebar', this.currentSidebarWidth);
  }
  toggleTags() {
    this.tagsShown = !this.tagsShown;
    this.localStorage.set(this.appName + 'tagsShown', this.tagsShown);
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
    let ret = this.utHTTP.parseInfluxData(data, this.labelBlackList);
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



    // add absH and dew_point
    const new_raw_labels = [];
    const new_short_labels = [];
    for (let hcolumn = 1; hcolumn < this.raw_labels.length; hcolumn++) {
      const hlabel = this.raw_labels[hcolumn];
      if (hlabel.field.endsWith("_rel_percent")) {
        for (let tcolumn = 1; tcolumn < this.raw_labels.length; tcolumn++) {
          const tlabel = this.raw_labels[tcolumn];
          if (tlabel.field.endsWith("_degC") && this.h.objectsEqual(hlabel.tags, tlabel.tags)) {
            console.log('Found corresponding rH/T columns:', hlabel, tlabel)
            const new_raw_column_label = cloneDeep(hlabel);
            new_raw_column_label['tags']['SRC'] = 'computed';
            const new_raw_column_label_aH = cloneDeep(new_raw_column_label);
            new_raw_column_label_aH['field'] = hlabel['field'].replace(/_rel_percent/, "_gpm3");
            new_raw_labels.push(new_raw_column_label_aH);
            const new_raw_column_label_dP = cloneDeep(new_raw_column_label);
            new_raw_column_label_dP['field'] = "dewPoint_degC"; // FIXME !!!! hlabel['field'] =
            new_raw_labels.push(new_raw_column_label_dP);

            const new_shortlabel = this.short_labels[hcolumn-1].replace(",", ", SRC: computed,"); // hacky way to modify text;
            new_short_labels.push(new_shortlabel.replace("( rel-% )", '( g / m³ )'))
            new_short_labels.push(new_shortlabel.replace(/ [^,]+$/, ' dew point ( °C )'))

            for (let r = 0; r < idata.length; r++) {
              const row = idata[r];
              const h = row[hcolumn];
              const t = row[tcolumn];
              row.push(this.h.absHumidity(t, h));
              row.push(this.h.dewPoint(t, h));
            }

            break;
          }
        }
      }
    }
    console.log(new_raw_labels, new_short_labels);
    this.raw_labels.push(...new_raw_labels);
    this.short_labels.push(...new_short_labels);

    // add rH at reference Temperature
    let nr_temps = 0
    for (let tcolumn = 1; tcolumn < this.raw_labels.length; tcolumn++) {
      if (this.raw_labels[tcolumn].metric == "temperature") {
        nr_temps++
      }
    }
    if(nr_temps > 1) {
      console.log('error in reference T: more than 1 column found');
    }
    if(nr_temps == 1) {
      const new_raw_labels = [];
      const new_short_labels = [];
      for (let tcolumn = 1; tcolumn < this.raw_labels.length; tcolumn++) {
        const tlabel = this.raw_labels[tcolumn];
        if (tlabel.metric == "temperature") {
          console.log("using column", tcolumn, "for T reference:", tlabel);
          const tcompare_tags = cloneDeep(tlabel.tags)
          tcompare_tags['SRC'] = 'computed';
          for (let DPcolumn = 1; DPcolumn < this.raw_labels.length; DPcolumn++) {
            const DPlabel = this.raw_labels[DPcolumn];

            if (DPlabel.field == "dewPoint_degC" && !this.h.objectsEqual(DPlabel.tags, tcompare_tags)) {
              console.log('computing rH at reference T for', DPlabel);
              const new_raw_column_label = cloneDeep(DPlabel);
              new_raw_column_label['tags']['REF'] = tlabel['tags']['SENSOR'];
              new_raw_column_label['metric'] = 'humidity';
              new_raw_labels.push(new_raw_column_label);

              const new_shortlabel = this.short_labels[DPcolumn-1].replace("SRC: computed,", "SRC: computed, REF: " + tlabel['tags']['sensor']); // hacky way to modify text;
              new_short_labels.push(new_shortlabel.replace(/dew point.*$/, 'H₂O ( rel-% )'))

              for (let r = 0; r < idata.length; r++) {
                const row = idata[r];
                const DP = row[DPcolumn];
                const t = row[tcolumn];
                row.push(this.h.relHumidity(t, DP));
              }
            }
          }

        }
      }
      console.log(new_raw_labels, new_short_labels);
      this.raw_labels.push(...new_raw_labels);
      this.short_labels.push(...new_short_labels);
    }


    for (let rli = 0; rli < this.raw_labels.length; rli++) {
      const raw_tags = this.raw_labels[rli].tags;
      for (const key in raw_tags) {
        if (Object.prototype.hasOwnProperty.call(raw_tags, key)) {
          if (!Object.prototype.hasOwnProperty.call(this.taglist, key)) {
            this.taglist[key] = true;
          }
        }
      }
    }

    // let logscale = true;
    const newColors = this.h.getColorsforLabels([undefined].concat(this.short_labels));
    const numColumns = this.raw_labels.length;
    for (let c = 1; c < numColumns; c++) {
      const item = labels[c];
      this.round_digits.push(this.sensorService.getDigits(this.raw_labels[c]));
    }
    // console.log(cloneDeep(this.dygLabels));
    // if (logscale) {
    //   console.log('scale: log');
    //   this.extraDyGraphConfig.logscale = logscale;
    // } else {
    //   console.log('scale: lin');
    // }

    this.startTime = this.userStartTime;
    const newLabels = ['Date'];
    newLabels.concat(this.short_labels);
    this.labels = ['Date'].concat(this.short_labels);
    this.data = idata;
    this.colors = newColors;
    console.log(labels);
    console.log(idata);
    this.changeTrigger += 1;
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
