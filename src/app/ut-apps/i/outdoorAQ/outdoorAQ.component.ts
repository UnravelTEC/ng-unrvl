import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';
import { HelperFunctionsService } from 'app/core/helper-functions.service';
import { LocalStorageService } from 'app/core/local-storage.service';
import { SensorService } from 'app/shared/sensor.service';
import { cloneDeep, forIn } from 'lodash-es';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';

@Component({
  selector: 'app-outdoorAQ',
  templateUrl: './outdoorAQ.component.html',
  styleUrls: ['./outdoorAQ.component.scss']
})
export class outdoorAQComponent implements OnInit {

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

  public appName = 'Gaseous Pollutants';


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
  convUGPM3toPPB(raw_labels: Array<Object>, data: Array<any>) {
    // 1. search for all _ugpm3 source inputs
    // 2. search for corresponding t and p
    // 3. calculate
    const mol_masses = { 'NO2': 46.0055 }
    const gas_constant = 8.314472

    const ugpm3_columns = []; // {'c': $nr_column, 'gas': "$gas_string", 't_col': $nr, 'p_col': $nr }
    for (let i = 1; i < raw_labels.length; i++) { // col 0: Date
      const clabel = raw_labels[i];
      if (clabel['metric'] != 'gas' || !clabel['field'].endsWith('_ugpm3'))
        continue;
      const gas = clabel['field'].replace(/_ugpm3$/, '').replace(/^mean_/, '')
      if (!gas || gas.length == 0)
        continue;
      console.log('found gas', gas, 'in column', clabel);
      if (!Object.prototype.hasOwnProperty.call(mol_masses, gas)) {
        console.error(gas, 'unknown, ignoring');
        continue
      }
      const gastags = clabel['tags'];
      let gashost = '';
      if (Object.prototype.hasOwnProperty.call(gastags, 'host')) {
        gashost = gastags['host']
      } else {
        console.log('convUGPM3toPPB Fault: gas has no nost');
        continue
      }
      let t_col = 0, p_col = 0;
      for (let j = 1; j < raw_labels.length; j++) {
        if (i == j) continue;
        const label2check = raw_labels[j];
        const this_tags = label2check['tags'];
        if (Object.prototype.hasOwnProperty.call(this_tags, 'host') && this_tags['host'] == gashost) {
          if (label2check['metric'] == 'pressure' && label2check['field'].endsWith('air_hPa')) {
            p_col = j;
          }
          if (label2check['metric'] == 'temperature' && label2check['field'].endsWith('air_degC')) {
            t_col = j;
          }
        }
      }
      if (t_col == 0 || p_col == 0) {
        console.log('convUGPM3toPPB Fault: gas has no t or p cols', t_col, p_col);
        continue
      }
      ugpm3_columns.push({ 'c': i, 'gas': gas.toUpperCase(), 't_col': t_col, 'p_col': p_col });
    }
    if (ugpm3_columns.length == 0) {
      console.log('convUGPM3toPPB: no gases able to convert to ppb found');
      return
    }
    let first = false;
    for (let i = 0; i < ugpm3_columns.length; i++) {
      const gas_item = ugpm3_columns[i];
      const mol_mass = mol_masses[gas_item['gas']]
      const C = 0.1 * mol_mass / gas_constant;

      const new_raw_column_label = cloneDeep(raw_labels[gas_item['c']])
      new_raw_column_label['field'] = new_raw_column_label['field'].replace(/_ugpm3/, "_ppb")
      new_raw_column_label['tags']['SRC'] = 'computed'
      raw_labels.push(new_raw_column_label);
      this.short_labels.push(this.short_labels[gas_item['c'] - 1]  // not nice to modify member vars
        .replace('( µg / m³ )', "( ppb )")
        .replace(' NO', ' SRC: computed, NO')); // and hacky way to modify text

      for (let r = 0; r < data.length; r++) {
        const row = data[r];
        const g = row[gas_item['c']];
        const p = row[gas_item['p_col']];
        const t = row[gas_item['t_col']];
        let gas_ppb = NaN;
        if (Number.isFinite(g) && Number.isFinite(p) && Number.isFinite(t) && p != 0) {
          gas_ppb = g / C / p * (t + 273.15);
          if (first == false) {
            console.log('g', g, 'C', C, 'p', p, 't', t + 273.15, 'ppb', gas_ppb);
            first = true;
          }
        }
        row.push(gas_ppb)
      }
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

    //
    const queries = this.utHTTP.influxMeanQuery(
      'gas',
      timeQuery,
      {},
      this.meanS,
      '/_V|_ppm$/',
      'sensor,serial,mfgdate'
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

    // FIXME this.h.unifyColumns scrambles labels! # Let Influx do the merge!
    // const retNO = this.h.unifyColumns(/NO_V$/, idata, this.short_labels, this.raw_labels, this.labelBlackListT);
    // const retNO2 = this.h.unifyColumns(/ NO2_V$/, retNO["data"], retNO["short_labels"], retNO["raw_labels"], this.labelBlackListT);
    // const retCO = this.h.unifyColumns(/ CO_V$/, retNO2["data"], retNO2["short_labels"], retNO2["raw_labels"], this.labelBlackListT);
    // const retO3 = this.h.unifyColumns(/ O3\+NO2_V$/, retCO["data"], retCO["short_labels"], retCO["raw_labels"], this.labelBlackListT);
    // idata = retO3.data;
    // this.raw_labels = retO3.raw_labels
    // this.short_labels = retO3.short_labels
    // console.log('after unify raw labels:', cloneDeep(this.raw_labels));
    // console.log('after unify short labels:', cloneDeep(this.short_labels));
    // this.convUGPM3toPPB(this.raw_labels, idata);
    const retPPB = this.h.convVtoPPB(idata, this.raw_labels, this.short_labels, this.show_dev);
    idata = retPPB.data
    this.raw_labels = retPPB.raw_labels
    this.short_labels = retPPB.short_labels
    const retUG = this.h.convPPBtoUGPM3(idata, this.raw_labels, this.short_labels)
    idata = retUG.data
    this.raw_labels = retUG.raw_labels
    this.short_labels = retUG.short_labels


    let keep_columns = [0] // date
    for (let i = 1; i < this.raw_labels.length; i++) { // with "Date" on pos 0
      const field = this.raw_labels[i]['field']
      if (!this.show_n && (field.endsWith('_degC') || field.endsWith('_hPa') || field.startsWith('n ('))) {
        continue;
      }
      if (this.show_V && field.endsWith("_V")) {
        keep_columns.push(i)
      } else if (this.show_ppb && field.endsWith("_ppb")) {
        keep_columns.push(i)
      } else if (!field.endsWith("_V") && !field.endsWith("_ppb")) {
        keep_columns.push(i)
      }
    }
    console.log("keeping only", keep_columns);

    const new_raw_labels = [{ metric: "Date", tags: {}, field: "" }];
    const new_short_labels = [];
    for (let i = 1; i < keep_columns.length; i++) {
      const c = keep_columns[i];
      new_raw_labels.push(this.raw_labels[c])
      new_short_labels.push(this.short_labels[c - 1])
    }
    const new_data = []
    for (let r = 0; r < idata.length; r++) {
      const new_row = []
      for (let c = 0; c < keep_columns.length; c++) {
        new_row.push(idata[r][keep_columns[c]])
      }
      new_data.push(new_row)
    }
    console.log("after -V", cloneDeep(new_data));

    idata = new_data
    this.raw_labels = new_raw_labels
    this.short_labels = new_short_labels

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
