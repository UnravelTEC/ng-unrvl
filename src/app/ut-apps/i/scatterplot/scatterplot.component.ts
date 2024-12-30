import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';
import { HelperFunctionsService } from 'app/core/helper-functions.service';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';
import { cloneDeep } from 'lodash-es';

@Component({
  selector: 'app-scatterplot',
  templateUrl: './scatterplot.component.html',
  styleUrls: ['./scatterplot.component.scss']
})
export class ScatterplotComponent implements OnInit {

  graphWidth = 1500;
  setGraphWidth(width) {
    this.graphWidth = width;
    console.log('new w', width);
  }
  public queryRunning = false;

  public autoreload = false;

  public Ms = ["querying..."]; // measurements from influx
  // public Series = { '$m': { 'common_tags': "...", "differenting_tags": [] } }; // { "$k1": [], "k2": [] } } };
  public Series_per_m = {}; // { $m: [] }
  public M1 = "?"; // chosen measurement 1
  public M2 = "?"; // chosen measurement 2

  public S1 = "";
  public S2 = "";

  public FK1 = "";
  public FK2 = "";

  public Q1 = "";
  public Q2 = "";

  public fieldKeys = {} // # { $M: [] }

  public key_ignore_list = ['host', 'topic'];

  public data = [];
  public labels = [];
  raw_labels = [];
  colors = [];
  public show_deviation = false;

  scatterdata = [];
  scatterlabels = [];

  y2label = 'M2';

  extraDyGraphConfig = {
    // connectSeparatedPoints: true,
    pointSize: 3,
    logscale: false,
    series: {
      'S2': {
        axis: 'y2',
      },
    },

    axes: {
      y2: {
        independentTicks: true, // default opt here to have a filled object to access later
        axisLabelWidth: 60
      },
    },
  };
  extraScatterDygCfg = {};
  raw_scatter_labels = [];
  xscatterlabel = "x";
  yscatterlabel = "y";
  scattercolors = [];

  public allowVector2 = false;
  public useVector2 = false;
  public vectorDir2 = 0;

  public from: number; // unix time from urlparam
  public to: number; // unix time from urlparam
  interval: string;

  orig_labels = [];
  common_label = '';
  short_labels: string[] = [];

  public startTime = '6h';
  public dygStartTime: string;
  ylabel = '';
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
    if (this.from != timearray[0] || this.to != timearray[1]) {
      this.fromTime = new Date(timearray[0]);
      this.from = timearray[0];
      this.toTime = new Date(timearray[1]);
      this.to = timearray[1];
      const rangeSeconds = Math.floor((timearray[1] - timearray[0]) / 1000);
      this.currentRange = this.h.createHRTimeString(rangeSeconds);
      if (!interval) {
        this.userMeanS = this.h.calcMean(rangeSeconds, this.graphWidth);
        this.interval = String(this.userMeanS);
      } else {
        this.userMeanS = Number(interval);
      }
      this.checkQ1(true);
      this.checkQ2(true);
      this.scatterdata = this.createScatterData(this.data, this.from, this.to);
    }
  }

  constructor(private globalSettings: GlobalSettingsService, private utHTTP: UtFetchdataService, private h: HelperFunctionsService) {
    this.globalSettings.emitChange({ appName: 'Corellation' });
  }


  ngOnInit() {
    this.launchMs('show series');
  }

  launchMs(clause: string) {
    if (!this.globalSettings.influxReady()) {
      setTimeout(() => {
        this.launchMs(clause);
      }, 1000);
      return;
    }
    const q = this.utHTTP.buildInfluxQuery(clause);
    this.utHTTP.getHTTPData(q).subscribe(
      (data: Object) => this.handleMs(data),
      (error) => this.globalSettings.displayHTTPerror(error)
    );
  }

  handleMs(data: Object) {
    // console.log('received', data);
    const series = this.h.getDeep(data, ['results', 0, 'series', 0, 'values']);
    console.log('series', series);
    this.Ms = [];
    for (let i = 0; i < series.length; i++) {
      const seri = series[i][0];
      const m_and_tags = seri.split(',')
      const measurement = m_and_tags[0];
      if (measurement == 'calibrations') {
        continue;
      }
      if (!this.Ms.includes(measurement)) {
        this.Ms.push(measurement);
      }
      const this_series_tags = [];
      for (let i = 1; i < m_and_tags.length; i++) {
        const k_is_v = m_and_tags[i];
        const element = k_is_v.split("=");
        const k = element[0];
        if (this.key_ignore_list.includes(k)) {
          continue;
        }
        const v = element[1];
        this_series_tags.push(k_is_v);
      }

      if (!this.Series_per_m[measurement]) {
        this.Series_per_m[measurement] = []
      }
      this.Series_per_m[measurement].push(this_series_tags.join(", "));
    }
    console.log(this.Series_per_m);

    const q = this.utHTTP.buildInfluxQuery("show field keys on " + this.globalSettings.server.influxdb);
    this.utHTTP.getHTTPData(q).subscribe(
      (data: Object) => this.handleFieldKeys(data),
      (error) => this.globalSettings.displayHTTPerror(error)
    );
  }
  handleFieldKeys(data) {
    console.log("handleFieldKeys");

    console.log(data);
    const series = this.h.getDeep(data, ['results', 0, 'series']);
    console.log('series', series);

    for (let i = 0; i < series.length; i++) {
      const element = series[i];
      const m = element['name'];
      this.fieldKeys[m] = [];
      element['values'].forEach(fk => {
        if (fk[1] == 'float' || fk[1] == 'integer') {
          this.fieldKeys[m].push(fk[0])
        }
      });

    }
    console.log(this.fieldKeys);
  }

  changeM1() {
    if (this.Series_per_m[this.M1] && this.Series_per_m[this.M1].length == 1) {
      this.S1 = this.Series_per_m[this.M1][0]
    } else {
      this.S1 = "";
    }
    if (this.fieldKeys[this.M1] && this.fieldKeys[this.M1].length == 1) {
      this.FK1 = this.fieldKeys[this.M1][0]
    } else {
      this.FK1 = "";
    }
    this.checkQ1();
  }
  changeM2() {
    if (this.Series_per_m[this.M2] && this.Series_per_m[this.M2].length == 1) {
      this.S2 = this.Series_per_m[this.M2][0]
    } else {
      this.S2 = "";
    }
    if (this.fieldKeys[this.M2] && this.fieldKeys[this.M2].length == 1) {
      this.FK2 = this.fieldKeys[this.M2][0]
    } else {
      this.FK2 = "";
    }
    if (this.fieldKeys[this.M2] && this.fieldKeys[this.M2].length > 1
      && this.fieldKeys[this.M2].includes("speed_mps") && this.fieldKeys[this.M2].includes("direction_deg")) {
      this.allowVector2 = true;
    } else {
      this.allowVector2 = false;
    }
    this.checkQ2();
  }
  change1() {
    this.checkQ1();
  }
  change2() {
    this.checkQ2();
  }


  reloadS1() {
    console.log("reloadS1");

    alert("S1 !")
    // if (this.from && this.to) {
    //   this.from = Number(this.from);
    //   this.to = Number(this.to);
    //   this.updateFromToTimes([this.from, this.to], this.interval);
    //   this.reload(true);
    // } else {
    //   this.reload();
    // }
  }
  checkQ1(fromTo = false) {
    if (this.M1 && this.S1 && this.FK1) {
      this.Q1 = this.createQ(this.M1, this.S1, this.FK1, fromTo);
    } else {
      this.Q1 = ""
    }
  }
  checkQ2(fromTo = false) {
    if (this.M2 && this.S2 && (this.FK2 || this.useVector2)) {
      const fk = this.useVector2 ? "(direction_deg|speed_mps)" : this.FK2;
      this.Q2 = this.createQ(this.M2, this.S2, fk, fromTo);
    } else {
      this.Q2 = ""
    }
  }



  createQ(m, tags: string, fk, fromTo = false): string {

    this.meanS = this.userMeanS;
    this.currentres = this.meanS;
    this.currentresText = this.h.createHRTimeString(this.meanS);
    this.startTime = this.userStartTime;
    this.dygStartTime = fromTo ? undefined : this.startTime;

    const timerange = fromTo
      ? (this.toTime.valueOf() - this.fromTime.valueOf()) / 1000
      : this.h.parseToSeconds(this.startTime);
    const nr_points = timerange / this.meanS;
    // if (nr_points > 10000 && !this.h.bigQconfirm(nr_points)) {
    //   if (!this.labels.length) {
    //     // at start to show "no data"
    //     this.labels = [''];
    //   }
    //   return;
    // }
    // this.queryRunning = true;

    const timeQuery = fromTo
      ? this.utHTTP.influxTimeString(this.fromTime, this.toTime)
      : this.utHTTP.influxTimeString(this.startTime);

    const tags1 = {};
    const strtags1 = tags.split(',');
    strtags1.forEach(tag => {
      const kv = tag.split("=");
      tags1[kv[0]] = kv[1];
    });
    const q1 = this.utHTTP.influxMeanQuery(
      m,
      timeQuery,
      tags1,
      this.meanS,
      '/^' + fk + '$/'
    );
    return q1;
  }
  reload() {
    if (!this.Q1 || !this.Q2) {
      alert("define both queries first");
      return;
    }
    this.launchQuery(this.Q1 + this.Q2)
  }
  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);

    this.userMeanS = this.h.calcMean(rangeSeconds, this.graphWidth);
    this.checkQ1();
    this.checkQ2();
  }

  launchQuery(clause: string) {
    this.utHTTP.getHTTPData(this.utHTTP.buildInfluxQuery(clause)).subscribe(
      (data: Object) => this.handleData(data),
      (error) => {
        this.queryRunning = false;
        this.globalSettings.displayHTTPerror(error);
      }
    );
  }
  handleData(data: Object) {
    console.log('received', data);
    let ret = this.utHTTP.parseInfluxData(data);
    console.log('parsed', ret);

    if (ret['error']) {
      alert('Influx Error: ' + ret['error']);
      this.queryRunning = false;
      this.autoreload = false;
      return;
    }

    let labels = ret['labels'];
    let idata = ret['data'];
    let newShortLabels = ret['short_labels'];
    let newRawLabels = ret['raw_labels'];
    if (this.useVector2) {
      let first_col_index = 0;
      let direction_col_index = 0;
      let magnitude_col_index = 0;
      for (let li = 0; li < ret['orig_labels'].length; li++) {
        const label = ret['orig_labels'][li];
        if (label.endsWith("direction_deg")) {
          direction_col_index = li + 1;
        } else if (label.endsWith("speed_mps")) {
          magnitude_col_index = li + 1;
        } else {
          first_col_index = li + 1;
        }
      }
      if (!first_col_index || !direction_col_index || !magnitude_col_index) {
        alert("error in DB return, vector data incomplete");
        return;
      }
      const vlabels = ['Date', labels[first_col_index], labels[magnitude_col_index]];
      const vdata = [];
      const delta_angle = this.vectorDir2;
      newShortLabels = [newShortLabels[first_col_index - 1], newShortLabels[magnitude_col_index - 1]];
      newRawLabels = [newRawLabels[0], newRawLabels[first_col_index], newRawLabels[magnitude_col_index]];

      const degree_to_rad = Math.PI / 360;
      for (let i = 0; i < idata.length; i++) {
        const row = idata[i];
        // subtract
        const new_dir = degree_to_rad * (row[direction_col_index] - delta_angle) ;
        const new_mag = row[magnitude_col_index] * Math.cos(new_dir);
        const new_row = [row[0], row[first_col_index], new_mag]
        vdata.push(new_row);
      }
      idata = vdata;
      labels = vlabels;
    }

    // this.orig_labels = cloneDeep(ret['labels']); // needed?
    this.short_labels = newShortLabels;
    this.extraDyGraphConfig.series[this.short_labels[1]] = {
      axis: 'y2',
    };
    this.common_label = ret['common_label'];
    this.raw_labels = newRawLabels;
    console.log('orig labels:', this.orig_labels);
    console.log('raw labels:', ret['raw_labels'], this.raw_labels);
    console.log('common_label:', ret['common_label']);
    console.log('short_labels:', ret['short_labels'], this.short_labels);

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
    }
    this.startTime = this.userStartTime;
    this.labels = ['Date'].concat(this.short_labels);
    this.data = idata;
    this.colors = newColors;
    console.log(labels);
    console.log(idata);
    // this.changeTrigger += 1;
    this.queryRunning = false;

    if (!this.data || !this.data[0]) {
      return;
    }

    const lscatterdata = this.createScatterData(idata);

    const lraw_scatter_labels = [this.raw_labels[1], this.raw_labels[2]];
    const lscatterlabels = [this.labels[1], this.labels[2]];
    const lxscatterlabel = this.labels[1];
    const lyscatterlabel = this.labels[2];

    this.scatterdata = lscatterdata;
    this.raw_scatter_labels = lraw_scatter_labels;
    this.scatterlabels = lscatterlabels;
    this.xscatterlabel = lxscatterlabel;
    this.yscatterlabel = lyscatterlabel;
  }
  createScatterData(data, from = -Infinity, to = Infinity) {
    const lscatterdata = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const dateval = row[0].valueOf()
      if (dateval > from && dateval < to) {
        const scatterrow = [row[1], row[2]];
        lscatterdata.push(scatterrow);
      }
    }
    lscatterdata.sort(function (a, b) { return a[0] - b[0] });
    return lscatterdata;
  }

}


/*
  todos :
  * switch X/Y (S1 und S2)
  * select database points
*/
