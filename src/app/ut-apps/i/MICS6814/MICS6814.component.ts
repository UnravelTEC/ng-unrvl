import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';
import { HelperFunctionsService } from 'app/core/helper-functions.service';
import { LocalStorageService } from 'app/core/local-storage.service';
import { SensorService } from 'app/shared/sensor.service';
import { cloneDeep, forIn } from 'lodash-es';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';

@Component({
  selector: 'app-MICS6814',
  templateUrl: './MICS6814.component.html',
  styleUrls: ['./MICS6814.component.scss']
})
export class MICS6814Component implements OnInit {

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
  y2label = 'Temperature AE correction';
  labelBlackListT = ['mean_*', 'ADC', 'maxrange_V', 'resolution_mV', 'resolution_bits', 'mode', 'averaged_count']; // mean is when only 1 graph is returned
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
  public currentresText = '0&thinsp;s';
  public userMeanS = this.meanS;
  public fromTime: Date;
  public toTime: Date;
  public currentRange: string;

  labels = [];
  data = [];
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

  measurement = 'gas';
  ylabel = '';
  interval: string;
  background: string;
  value = '*';
  public from: number; // unix time from urlparam
  public to: number; // unix time from urlparam

  public queryRunning = false;

  public reload_timer = Infinity;
  public last_reload: number;

  public show_ppb = true;
  public show_V = false;
  public show_n = false;
  public show_dev = false;

  public tableShown = false;
  public sideBarShown = true;

  public appName = 'MICS6814';


  constructor(public gss: GlobalSettingsService, private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService,
    public h: HelperFunctionsService,
    private sensorService: SensorService
  ) {
    this.gss.emitChange({ appName: this.appName });
  }

  ngOnInit(): void {
    [
      'userMeanS',
      'userStartTime',
      'tableShown',
      'show_V',
      'show_n',
      'show_dev',
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
  *     .. currently, we use HMWs for all data anyway... is it more correct to calculate it for each 1s-datapoint than to avg over 1800?
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
    data: [[Date, value1, ... , valueN]]
    searches for other columns from this host with air_degC and air_hPa, and calculates ppb values out of it
    does add data columns (in-place, call to reference), and corresponding label
    NO2_ugpm3 = NO2_ppm * konstante * pressure / (T_Kelvin), konstante = 100*46.0055 [molar mass NO2] / 8.314472 [gasconst] = 553.31836
    *   reverse: NO2_ppb = NO2_ugpm3 / C / p * T / 1000
  */

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
      { 'sensor': 'MICS6814' },
      this.meanS,
      '/_V$/',
      'sensor'
    )

    this.launchQuery(queries);
  }
  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);

    this.userMeanS = this.h.calcMean(rangeSeconds, this.graphWidth);

    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
    this.localStorage.set(this.appName + 'userStartTime', this.userStartTime);
    this.reload();
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
  saveCheckBoxes() {
    [
      'show_V',
      'show_n',
      'show_dev',
    ].forEach((element) => {
      const thing = this.localStorage.set(this.appName + element, this[element]);
    });
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
    let idata = ret['data'];
    this.short_labels = ret['short_labels'];
    this.common_label = ret['common_label'];
    this.raw_labels = ret['raw_labels'];
    console.log('orig labels:', cloneDeep(ret['labels']));
    console.log('raw labels:', ret['raw_labels']);
    console.log('common_label:', ret['common_label']);
    console.log('short_labels:', ret['short_labels']);



     const numColumns = this.raw_labels.length;
    const labelsForColors = ['Date'].concat(cloneDeep(this.short_labels));
    for (let c = 1; c < numColumns; c++) {
      const item = this.short_labels[c - 1];
      this.short_labels[c - 1] = item.replace(/^gas sensor: /, '')
    }

    console.log('after -V raw labels:', cloneDeep(this.raw_labels));
    console.log('after -V short labels:', cloneDeep(this.short_labels));

    let logscale = true;
    this.data = idata;
    this.labels = ['Date'].concat(this.short_labels);
    const newColors = this.h.getColorsforLabels(labelsForColors);

    for (let c = 1; c < numColumns; c++) {
      const item = this.short_labels[c - 1];

      // if (logscale == true) {
      //   for (let r = 0; r < idata.length; r++) {
      //     const point = idata[r][c];
      //     if (point <= 0 && !Number.isNaN(point) && point !== null) {
      //       logscale = false;
      //       console.log('found', idata[r][c], '@r', r, 'c', c, 'of', item);
      //       break;
      //     }
      //   }
      // }
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
      //      if (item.match(/hPa/)) {
      if (item.match(/n.\(.factor.\)/u)) {
        this.extraDyGraphConfig.axes.y2['axisLabelWidth'] = 60;
        this.extraDyGraphConfig.series[item] = {
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
    this.data = idata;
    this.colors = newColors;
    console.log(this.labels);
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
  }
  handleRunningAvg(dataObj: Object) {
    this.allAverages = dataObj['all'];
    this.visibleAverages = dataObj['visible'];
  }

}
