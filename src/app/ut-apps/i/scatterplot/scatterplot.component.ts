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

  public from: Number; // unix time from urlparam
  public to: Number; // unix time from urlparam
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
  calcMean(secondsRange) {
    const divider = Math.floor(secondsRange / this.graphWidth);
    return divider > 1 ? divider : 1;
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
    const Series_per_m = {}; // { $m: [] }
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

      // const all_tags_per_series_per_m = {}
      // const common_tags = {}
      // const differenting_tags = {}

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



      //   if (!all_tags[k])
      //     all_tags[k] = [];
      //   all_tags[k].push(v);
      // }

      // if (!this.Series[measurement]) {
      //   this.Series[measurement] = [m_and_tags[1]];
      // } else {
      //   this.Series[measurement].push(m_and_tags[1])
      // }
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
    if (this.Series_per_m[this.M1].length == 1) {
      this.S1 = this.Series_per_m[this.M1][0]
    } else {
      this.S1 = "";
    }
    if (this.fieldKeys[this.M1].length == 1) {
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
  checkQ1() {
    if (this.M1 && this.S1 && this.FK1) {
      this.Q1 = this.createQ(this.M1, this.S1, this.FK1);
    } else {
      this.Q1 = ""
    }
  }
  checkQ2() {
    if (this.M2 && this.S2 && this.FK2) {
      this.Q2 = this.createQ(this.M2, this.S2, this.FK2);
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
      '/^' + fk  + '$/'
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

    this.userMeanS = this.calcMean(rangeSeconds);
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
    const labels = ret['labels'];
    const idata = ret['data'];
    this.orig_labels = cloneDeep(ret['labels']);
    this.short_labels = ret['short_labels'];
    this.extraDyGraphConfig.series[this.short_labels[1]] = {
      axis: 'y2',
    };
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
    }
    this.startTime = this.userStartTime;
    const newLabels = ['Date'];
    newLabels.concat(this.short_labels);
    this.labels = ['Date'].concat(this.short_labels);
    this.data = idata;
    this.colors = newColors;
    console.log(labels);
    console.log(idata);
    // this.changeTrigger = !this.changeTrigger;
    // this.changeTrigger = !this.changeTrigger;
    this.queryRunning = false;

    if (!this.data || !this.data[0]) {
      return;
    }
  }
  
}


/* 
  todos : 
  * switch X/Y (S1 und S2)
  * select database points
*/
