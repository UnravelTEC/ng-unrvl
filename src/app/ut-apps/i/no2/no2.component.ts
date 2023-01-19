import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';
import { HelperFunctionsService } from 'app/core/helper-functions.service';
import { LocalStorageService } from 'app/core/local-storage.service';
import { SensorService } from 'app/shared/sensor.service';
import { cloneDeep } from 'lodash-es';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';

@Component({
  selector: 'app-no2',
  templateUrl: './no2.component.html',
  styleUrls: ['./no2.component.scss']
})
export class No2Component implements OnInit {

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
  labelBlackListT = ['mean_*', 'gain', 'datarate_sps', 'averaged_count', 'ADC', 'maxrange_V', 'resolution_mV', 'resolution_bits', 'mode']; // mean is when only 1 graph is returned
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

  changeTrigger = true;

  measurement = 'gas';
  ylabel = '';
  interval: string;
  background: string;
  value = '*';
  public from: Number; // unix time from urlparam
  public to: Number; // unix time from urlparam

  public queryRunning = false;

  public reload_timer = Infinity;
  public last_reload: number;

  public tableShown = true;
  public sideBarShown = true;

  appName = 'NO2';

  constructor(public gss: GlobalSettingsService, private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService,
    private h: HelperFunctionsService,
    private sensorService: SensorService
  ) {
    this.gss.emitChange({ appName: this.appName });
  }

  /*
    data needed:
    adns voltage, tagged with NO2 and sensor serial + afe serial
    calibration factors needed:
    * differential offset (from db, changes?) - FOR SENSOR WITH SERIAL
    * mv/ppb scale factor (from db) - FOR SENSOR WITH SERIAL
    * log-threshold (see helper/ smoothNO2)
    *
    * we have 2 NO2 sensors -> but they've different names anyway.
    *   how to calibrate for different serials?
    *
    * Goals:
    *   visualise ppb
    *   visualise µg/m³
    *     - load P
    *     - load air_degC
    *   compare/calibrate to official NO2 values
    *     per day/per week
    *     - needs official Data (from DB?)
    *
    * Steps:
    *  0 offset electrical (ADC/AFE) offset:
    *   v_new = v_old + offset
    *  1 convert to ppb (via offset + linear multiplication factor)
    *   NO2_ppb = (v_old + offset) * Alphas_ppb_per_mV
    *  2 convert to µg/m³ (via T + P) (TODO which smooting interval to use?)
    *   NO2_ugpm3 = NO2_ppb * konstante * pressure / (T_Kelvin), konstante = 100*46.0055 [molar mass NO2] / 8.314472 [gasconst] = 553.31836
    *  3 log-threshold (TODO WHEN?) - or just set values to 0, as officials to too?
    * -> if global ± offset AFTER calc is used, this is influenced by P/T! -> use before!
    *   => we use factory cal factors (offset + scale factor), and add our own over time
    *  NOTE for calculating calibration params to official - use only "known good" values? (eg everything > threshold?)
    *
    * Datenstruktur zum Vergleich:
    * metric: fieldname
    *   temperature air_degC
    *   humidity H2O_rel_percent
    *   gas NO2_ugmp3 NO_ugpm3
    *   particulate_matter pm10_ugpm3
    *   pressure air_hPa
    * tags: host=Graz-O P, operator=A15
    *
    * ug2
  */

  /*
  @param raw_labels Array of Object structure matching data columns
  @param data - should include at least one with metric: gas; field: *_ugpm3 and a tag with a host
    searches for other columns from this host with air_degC and air_hPA, and calculates ppb values out of it
    does add data columns, and corresponding label
  */
  convUGPM3toPPB(raw_labels: Array<Object>, data: Array<any>, gas: string) {
    // 1. search for all _ugpm3 source inputs
    // 2. search for corresponding t and p
    // 3. calculate
    const mol_masses = { 'NO2': 46.0055 }
    const gas_constant = 8.314472

    const ugpm3_columns = []; // {'c': $nr_column, 'gas': "$gas_string" }
    for (let i = 1; i < raw_labels.length; i++) { // col 0: Date
      const clabel = raw_labels[i];
      if (clabel['metric'] != 'gas' || !clabel['field'].endsWith('_ugpm3'))
        continue;
      const gas = clabel['field'].replace(/_ugpm3$/, '').replace(/^mean_/, '')
      if (!gas || gas.length == 0)
        continue;
      console.log('found gas', gas, 'in column', clabel);
      ugpm3_columns.push({ 'c': i, 'gas': gas.toUpperCase() });

    }
  }

  ngOnInit(): void {
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

    this.reload();
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

    //
    const queries = this.utHTTP.influxMeanQuery(
      'gas',
      timeQuery,
      {},
      this.meanS,
      '/NO2_V/'
    ) +
      this.utHTTP.influxMeanQuery(
        'gas',
        timeQuery,
        { "operator": "A15" },
        this.meanS,
        '/NO2_ugpm3/'
      ) +
      this.utHTTP.influxMeanQuery(
        'pressure',
        timeQuery,
        {},
        this.meanS,
        '/air_hPa/'
      ) +
      this.utHTTP.influxMeanQuery(
        'temperature',
        timeQuery,
        {},
        this.meanS,
        '/air_degC/'
      );

    this.launchQuery(queries);
  }
  calcMean(secondsRange) {
    const divider = Math.floor(secondsRange / this.graphWidth);
    return divider > 1 ? divider : 1;
  }
  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);

    this.userMeanS = this.calcMean(rangeSeconds);

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
      // this.autoreload = false;
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
          if (point <= 0 && !Number.isNaN(point) && point !== null) {
            logscale = false;
            console.log('found', idata[r][c], '@r', r, 'c', c, 'of', item);
            break;
          }
        }
      }
      // NO2: ppm -> ppb
      // if (item.match(/NO₂ \(ppm\)/)) {
      //   labels[c] = item.replace(/ppm/, 'ppb');
      //   for (let r = 0; r < idata.length; r++) {
      //     idata[r][c] *= 1000;
      //   }
      // }
      // if (item.match(/NO₂ \(µg\/m³\)/)) {
      //   for (let r = 0; r < idata.length; r++) {
      //     idata[r][c] = this.h.smoothNO2(idata[r][c]);
      //   }
      // }
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
  }
  handleRunningAvg(dataObj: Object) {
    this.allAverages = dataObj['all'];
    this.visibleAverages = dataObj['visible'];
  }

}
