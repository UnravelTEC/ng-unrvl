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
  labelBlackList = ['mean_*']; // mean is when only 1 graph is returned
  public ls_taglist = {} // tagkey: true/false ; local copy of global taglist - so that even tags not present are remembered
  public taglist = {}; // only the tags the current dataset uses - so that displayed list is only as long as needed

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
  dygAnnotations = [];

  public allAverages = [];
  public visibleAverages = [];

  appName = 'Any Sens';

  changeTrigger = 0;

  measurement = 'temperature';
  ylabel = '';
  sensor: string;
  id: string;
  interval: string;
  background: string;
  host = '';
  value = '*';
  referrer = 'Allsens';
  public from: number; // unix time from urlparam
  public to: number; // unix time from urlparam

  public queryRunning = false;
  public query_age: number;

  public autoreload = false;
  public auto_interval = 1; // gets set to userMeanS
  public reload_timer = Infinity;
  public last_reload: number;

  public tableShown = true;
  public annotationsShown = true;
  public sideBarShown = true;
  public tagsShown = true;

  public annotationTable = []; // [{time_t:Date, time:Date, measurement: "", tags: "", field: "", OP: "CRUD", text: "" }]

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

    this.ls_taglist = this.localStorage.get(this.appName + 'taglist');

    for (const key in this.ls_taglist) {
      if (this.ls_taglist[key] === false) {
        this.labelBlackList.push(key);
      }
    }

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
    this.gss.emitChange({
      appName: this.measurement + (this.sensor ? ' ' + this.sensor : ''),
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

    if (fromTo) {
      this.launchQuery(this.createQuery(this.fromTime, this.toTime));
    } else {
      this.launchQuery(this.createQuery(this.startTime));
    }
  }

  createQuery(fromTime: any, toTime: Date = undefined) {
    const timeQuery = this.utHTTP.influxTimeString(fromTime, toTime);

    let params = { sensor: [] };
    if (this.sensor) {
      params['sensor'] = Array.isArray(this.sensor)
        ? this.sensor
        : [this.sensor];
    }
    if (this.host) {
      params['host'] = this.host;
    }
    if (this.id) {
      params['id'] = this.id;
    }

    return this.utHTTP.influxMeanQuery(
      this.measurement,
      timeQuery,
      params,
      this.meanS,
      this.value
    );
  }

  public newAnnoText = '';
  public inserting = false;
  setAnnotation() {
    const i = this.currentClickedLabelIndex;
    const t = this.data[this.currentClickedRow][0].valueOf();
    let tags = "";
    for (let [key, value] of Object.entries(this.raw_labels[i]['tags'])) {
      value = value['replace'](/([& ])/, "\\$1")
      tags += `,${key}=${value}`
    }

    let influxstring = `annotations,A_measurement=${this.raw_labels[i]["metric"]},A_field=${this.raw_labels[i]["field"]},A_operation=C${tags} A_time=${t},note="${this.newAnnoText}"`;
    this.inserting = true
    this.utHTTP
      .postData(this.utHTTP.buildInfluxWriteUrl(), influxstring)
      .subscribe(
        (res: any) => { console.log(res); this.inserting = false; this.getAnnotations(this.fromTime, this.toTime) },
        (error) => { this.gss.displayHTTPerror(error); this.inserting = false }
      );
  }
  delAnnotation(measurement, field, dygColumnNr, time) {
    let tags = "";
    for (let [key, value] of Object.entries(this.raw_labels[dygColumnNr]['tags'])) {
      value = value['replace'](/([& ])/, "\\$1")
      tags += `,${key}=${value}`
    }
    let influxstring = `annotations,A_measurement=${measurement},A_field=${field},A_operation=D${tags} A_time=${time}`;
    this.inserting = true
    this.utHTTP
      .postData(this.utHTTP.buildInfluxWriteUrl(), influxstring)
      .subscribe(
        (res: any) => { console.log(res); this.inserting = false; this.getAnnotations(this.fromTime, this.toTime) },
        (error) => { this.gss.displayHTTPerror(error); this.inserting = false }
      );
  }
  getAnnotations(fromTime: any, toTime: Date = undefined) {

    let fromTS =
      fromTime instanceof Date
        ? fromTime.valueOf()
        : Date.now() - this.h.parseToSeconds(fromTime) * 1000;
    let toTS = toTime ? toTime.valueOf() : undefined;

    const params = {};
    if (this.sensor) {
      params['sensor'] = Array.isArray(this.sensor)
        ? this.sensor
        : [this.sensor];
    }
    if (this.host) {
      params['host'] = this.host;
    }
    if (this.id) {
      params['id'] = this.id;
    }

    const annoquery = this.utHTTP.annotationsQuery(
      this.measurement,
      fromTS,
      toTS,
      params,
      this.value
    );
    console.log('annotationsQuery', annoquery);

    this.utHTTP
      .getHTTPData(
        this.utHTTP.buildInfluxQuery(annoquery, undefined, undefined)
      )
      .subscribe(
        (data: Object) => this.acceptAnnotations(data),
        (error) => {
          console.log('getAnnotations: Error following:');
          this.gss.displayHTTPerror(error);
        }
      );
  }
  acceptAnnotations(data) {
    console.log('acceptAnnotations', data);
    const new_annotationTable = []
    const new_dygAnnos = []

    const series = this.h.getDeep(data, ['results', 0, 'series'])
    if (!series) {
      this.annotationTable = [];
      console.log('no annos');
      return
    }
    series.forEach(seri => {
      const note_col = seri['columns'].indexOf('note')
      const time_col = seri['columns'].indexOf('A_time')
      const stags = seri['tags']
      const commonAnno = { field: stags['A_field'], measurement: stags['A_measurement'], OP: stags['A_operation'] }
      commonAnno['origtags'] = cloneDeep(stags)

      const commonAnnoTagArr = []
      for (const key in stags) {
        if (key.startsWith("A_"))
          continue
        const value = stags[key];
        if (value != "") {
          commonAnnoTagArr.push(key + ": " + value)
        }
      }
      commonAnno['tags'] = this.h.createSortedTagString(commonAnnoTagArr)

      seri['values'].forEach(row => {
        const annoObj = cloneDeep(commonAnno)
        annoObj['time'] = row[time_col]
        annoObj['note'] = row[note_col]
        if (annoObj['OP'] == "D") {
          for (let i = 0; i < new_annotationTable.length; i++) {
            const row = new_annotationTable[i];
            if (annoObj['time'] == row['time']
              && annoObj['tags'] == row['tags']
              && annoObj['field'] == row['field']
              && annoObj['measurement'] == row['measurement']) {
              new_annotationTable.splice(i, 1)
              break
            }
          }
        } else
          new_annotationTable.push(annoObj)
        // console.log(annoObj);
      });
    });
    // search for col nr, to use short_label index
    for (let i = 0; i < new_annotationTable.length; i++) {
      const annoObj = new_annotationTable[i];
      const tmpOrigLabel4Cmp = annoObj['measurement'] + ' ' + annoObj['tags'] + ' ' + annoObj['field']
      let dygLabel = ""
      for (let o = 0; o < this.orig_labels.length; o++) {
        if (tmpOrigLabel4Cmp == this.orig_labels[o]) {
          dygLabel = this.short_labels[o]
          annoObj['dygColumnNr'] = o + 1 // to compensate for no Date column in short- and orig_labels
          break
        }
      }
      if (!dygLabel) {
        console.log("!dygLabel", tmpOrigLabel4Cmp, 'in', this.orig_labels);
      }
      // time has to be matched to nearest data point for Dyg to attach it
      const origAnnoTsMS = annoObj['time']
      const newAnnoTsMS = this.h.findNearestDataTS(this.data, origAnnoTsMS)
      let shortext = '×'
      if (origAnnoTsMS < newAnnoTsMS) {
        shortext = '<'
      }
      if (origAnnoTsMS > newAnnoTsMS) {
        shortext = '>'
      }

      const dygAnno = { series: dygLabel, text: annoObj["note"], shortText: shortext, xval: newAnnoTsMS }
      new_dygAnnos.push(dygAnno)
      annoObj['dygAnnoNr'] = i; // to allow accessing dygAnno if annotationTable gets sorted later
    }
    this.annotationTable = new_annotationTable;
    this.dygAnnotations = new_dygAnnos;
    console.log("annotationTable", cloneDeep(this.annotationTable));
    console.log("dygAnnotations", cloneDeep(this.dygAnnotations));

    setTimeout(() => this.changeTrigger += 1, 300); // update DyGraph height after table size changed
  }

  public currentClickedRow = -1;
  public currentClickedLabelIndex: number;
  public currentClickedTags = '';
  acceptClickedRow($event) {
    console.log('acceptClickedRow', $event);
    this.currentClickedRow = $event['r'];
    this.currentClickedLabelIndex = this.short_labels.indexOf($event['s']) + 1;

    const tagArr = []
    for (const K in this.raw_labels[this.currentClickedLabelIndex]['tags']) {
      tagArr.push(K + ': ' + this.raw_labels[this.currentClickedLabelIndex]['tags'][K])
    }
    this.currentClickedTags = this.h.createSortedTagString(tagArr)
  }
  public currentlyHighlightedAnno = -1;
  highlightDygAnno(nr) {

    if (this.dygAnnotations[this.currentlyHighlightedAnno]) {
      this.dygAnnotations[this.currentlyHighlightedAnno]["cssClass"] = ""
    }

    if (this.currentlyHighlightedAnno == nr) {
      this.currentlyHighlightedAnno = -1;
    } else {
      this.currentlyHighlightedAnno = nr;
      this.dygAnnotations[nr]["cssClass"] = "highlighted"
    }
    this.changeTrigger += 1
  }

  reloadMissing() {
    // this.fromTime
    // this.from
    // this.toTime
    // this.to
    // this.latest_dates // Array of unix_ts, latest point with valid data per column

    const latest_t = Math.max(...this.latest_dates);
    let delta_t = this.to - latest_t;
    console.log(delta_t);
    if (delta_t > 0) {
      this.launchQuery(this.createQuery(new Date(latest_t), this.toTime));
    }
  }
  reloadMissingToNow() {
    const latest_t = Math.max(...this.latest_dates);
    this.launchQuery(this.createQuery(new Date(latest_t), new Date()));
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
    // console.log(this.taglist);
    for (const key in this.taglist) {
      this.ls_taglist[key] = this.taglist[key]; // cp local taglist to ls_taglist
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
    this.localStorage.set(this.appName + 'taglist', this.ls_taglist);
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
  toggleAnnotationsShown() {
    this.annotationsShown = !this.annotationsShown;
    this.changeTrigger += 1;
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
    this.queryRunning = true;
    this.query_age = 0;
    this.utHTTP.getHTTPData(this.utHTTP.buildInfluxQuery(clause)).subscribe(
      (data: Object) => this.handleData(data),
      (error) => {
        this.queryRunning = false;
        this.gss.displayHTTPerror(error);
      }
    );
    setTimeout(() => {
      this.increaseQueryAge();
    }, 100);
  }
  increaseQueryAge() {
    this.query_age += 0.1;
    if (this.queryRunning) {
      setTimeout(() => {
        this.increaseQueryAge();
      }, 100);
    }
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
      this.query_age = 0;
      return;
    }
    const new_labels = ret['labels'];
    const numColumns = new_labels.length;

    const idata = ret['data'];

    if (!idata || !idata.length) {
      this.queryRunning = false;
      console.log('handleData: no data');
      this.repeatAutoReloadIfEnabled();
      return;
    }
    console.log('orig labels:', this.orig_labels);
    console.log('raw labels:', this.raw_labels);
    console.log('common_label:', this.common_label);
    console.log('short_labels:', this.short_labels);

    let newDataLogscale = true;
    for (let c = 1; c < numColumns; c++) {
      const c_label = new_labels[c];
      for (let r = 0; r < idata.length; r++) {
        const point = idata[r][c];
        if (point <= 0 && !Number.isNaN(point) && point !== null) {
          newDataLogscale = false;
          console.log(
            'found non log-scale data:',
            idata[r][c],
            '@r',
            r,
            'c',
            c,
            'of',
            c_label
          );
          break;
        }
      }
    }

    for (let c = 1; c < numColumns; c++) {
      const c_label = new_labels[c];

      // NO2: ppm -> ppb
      if (c_label.match(/NO₂ \(ppm\)/)) {
        new_labels[c] = c_label.replace(/ppm/, 'ppb');
        for (let r = 0; r < idata.length; r++) {
          idata[r][c] *= 1000;
        }
      }
      if (c_label.match(/NO₂ \(µg\/m³\)/)) {
        for (let r = 0; r < idata.length; r++) {
          idata[r][c] = this.h.smoothNO2(idata[r][c]);
        }
      }
    }

    console.log('ready to insert:');
    console.log(new_labels);
    console.log(idata);

    // if all new labels are exactly the same as the old
    let append_similardata = false;
    const new_short_labels = ret['short_labels'];
    if (this.short_labels.length == new_short_labels.length) {
      append_similardata = true;
      for (let i = 0; i < this.short_labels.length; i++) {
        if (this.short_labels[i] !== new_short_labels[i]) {
          append_similardata = false;
          break;
        }
      }
    }

    // if all new labels are present in the old columns
    let append_less_columns = true;
    if (this.orig_labels) {
      for (let i = 1; i < new_labels.length; i++) {
        const new_label = new_labels[i];
        if (!this.orig_labels.includes(new_label)) {
          append_less_columns = false;
          break;
        }
      }
    }
    // disable appending if gotten data is from user clicked on "x time since now" - and does want to reload
    if (this.data && this.data.length > 1) {
      const latest_ts = this.data[this.data.length - 1][0].valueOf();
      const new_begin_ts = idata[0][0].valueOf();

      if (new_begin_ts < latest_ts) {
        // overlap
        console.log('overlap, reset displayed data');
        append_similardata = false;
        append_less_columns = false;
      }
      // interval does not match
      const old_interval = this.h.calcMedianGap(this.data);
      const new_interval = this.h.calcMedianGap(idata);
      // console.log("old_interval", old_interval, "new_interval", new_interval);
      if (idata.length > 1 && old_interval != new_interval) {
        console.log(
          'intervals do not match',
          old_interval,
          new_interval,
          ', reset displayed data'
        );
        append_similardata = false;
        append_less_columns = false;
      }
    }

    if (append_similardata || append_less_columns) {
      console.log(
        'handleData: received similar structured data, try to Append'
      );

      if (this.extraDyGraphConfig.logscale) {
        if (newDataLogscale) {
          console.log('logscale OK');
        } else {
          console.log('logscale: lin');
          this.extraDyGraphConfig.logscale = false;
        }
      }

      if (append_less_columns) {
        // sort new columns into old, then append
        console.log(
          'handleData: received less columns',
          cloneDeep(this.orig_labels),
          'vs',
          cloneDeep(new_labels)
        );
        const new_column_indices = [0]; // Date stays the same
        for (let c = 1; c < this.orig_labels.length; c++) {
          new_column_indices.push(new_labels.indexOf(this.orig_labels[c])); // -i if not found used later as indicator
        }
        console.log('new col indices:', new_column_indices);

        for (let r = 0; r < idata.length; r++) {
          const row = idata[r];
          const new_row = [row[0]];
          for (let c = 1; c < new_column_indices.length; c++) {
            const c_on_new_data = new_column_indices[c];
            new_row[new_row.length] =
              c_on_new_data == -1 ? null : row[c_on_new_data];
          }
          if (
            r == 0 &&
            this.data[this.data.length - 1][0].valueOf() == row[0].valueOf()
          ) {
            this.data[this.data.length - 1] = new_row;
          } else {
            this.data[this.data.length] = new_row;
          }
        }
      } else {
        for (let r = 0; r < idata.length; r++) {
          const row = idata[r];
          if (
            r == 0 &&
            this.data[this.data.length - 1][0].valueOf() == row[0].valueOf()
          ) {
            this.data[this.data.length - 1] = row;
          } else {
            this.data[this.data.length] = row;
          }
        }
      }
      console.log('data after append:', this.data);
      const tmpdata = this.data;
      this.data = undefined;
      this.data = tmpdata;
    } else {
      this.orig_labels = cloneDeep(ret['orig_labels']);
      this.short_labels = ret['short_labels'];
      this.common_label = ret['common_label'];
      this.raw_labels = ret['raw_labels'];
      this.labels = ['Date'].concat(this.short_labels);
      console.log('new orig labels:', ret['orig_labels']);
      console.log('new raw labels:', ret['raw_labels']);
      console.log('new common_label:', ret['common_label']);
      console.log('new short_labels:', ret['short_labels']);

      for (let rli = 0; rli < this.raw_labels.length; rli++) {
        const raw_tags = this.raw_labels[rli].tags;
        for (const key in raw_tags) {
          if (Object.prototype.hasOwnProperty.call(raw_tags, key)) {
            if (!Object.prototype.hasOwnProperty.call(this.taglist, key)) {
              this.taglist[key] = true;
            }
            if (!Object.prototype.hasOwnProperty.call(this.ls_taglist, key)) {
              this.ls_taglist[key] = true;
            }
          }
        }
      }

      this.colors = this.h.getColorsforLabels(new_labels);

      for (let c = 1; c < numColumns; c++) {
        const c_label = new_labels[c];

        if (c_label.match(/hPa/)) {
          this.extraDyGraphConfig.axes.y2['axisLabelWidth'] = 60;
          this.extraDyGraphConfig.series[this.short_labels[c - 1]] = {
            axis: 'y2',
          };
        }

        this.round_digits.push(
          this.sensorService.getDigits(this.raw_labels[c])
        );
      }
      if (newDataLogscale) {
        console.log('logscale OK');
        this.extraDyGraphConfig.logscale = true;
      } else {
        console.log('logscale: lin');
        this.extraDyGraphConfig.logscale = false;
      }

      this.data = idata;
    }

    this.startTime = this.userStartTime;
    this.currentClickedRow = -1;
    this.currentClickedLabelIndex = undefined;
    this.currentClickedTags = '';

    this.queryRunning = false;

    if (!this.data || !this.data[0]) {
      return;
    }

    this.changeTrigger += 1;

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
    this.fromTime = this.data[0][0]
    this.toTime = this.data[this.data.length - 1][0]

    this.repeatAutoReloadIfEnabled();
    this.getAnnotations(this.fromTime, this.toTime);
  }
  repeatAutoReloadIfEnabled() {
    if (this.autoreload) {
      setTimeout(() => {
        if (this.autoreload) {
          this.reloadMissingToNow();
        }
      }, this.auto_interval * 1000);
    }
  }
  handleRunningAvg(dataObj: Object) {
    this.allAverages = dataObj['all'];
    this.visibleAverages = dataObj['visible'];
  }
}
