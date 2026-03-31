import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';
import { ActivatedRoute } from '@angular/router';
import { cloneDeep } from 'lodash-es';
import { SensorService } from 'app/shared/sensor.service';

@Component({
  selector: 'app-nano4e',
  templateUrl: './nano4e.component.html',
  styleUrls: ['./nano4e.component.scss'],
})
export class Nano4EComponent implements OnInit {
  colors = [];
  graphWidth = 1500;
  setGraphWidth(width) {
    this.graphWidth = width;
    console.log('new w', width);
  }

  extraDyGraphConfig = {
    // connectSeparatedPoints: true,
    pointSize: 3,
    logscale: true,
    series: {
      'pressure sensor: BME280, pressure (hPa)': {
        axis: 'y2',
      },
    },

    axes: {
      y: {
        logscale: true,
      },
      y2: {
        independentTicks: true, // default opt here to have a filled object to access later
        // axisLabelWidth: 60, // set on demand
      },
    },
  };
  y2label = 'Atmospheric Pressure';
  labelBlockList = ['mean_*']; // mean is when only 1 graph is returned
  // public ls_taglist = {} // tagkey: true/false ; local copy of global taglist - so that even tags not present are remembered

  // only the tags the current dataset uses - so that displayed list is only as long as needed
  public taglist = {
    "AFEBOARD": true,
    "adc": false,
    "autogain": false,
    "averaged_count": true,
    "chip": true,
    "chipname": true,
    "datarate_sps": false,
    "gain": false,
    "host": false,
    "id": false,
    "interval_s": true,
    "material": true,
    "maxrange_V": false,
    "resolution_uV": false,
    "sensor": true,
    "LED21": true,
    "LED22": true,
    "LED_nm": true,
    "amcurstep": false,
    "heater_current_mA": false,
    "heater_degC": true,
    "led_current_mA": true,
    "meas_current_uA": true,
    "LED11": true,
    "LED12": true,
    "LED41": true,
    "LED42": true,
    "LED31": true,
    "LED32": true
  }
  private sidebarWidth = '15rem';
  public currentSidebarWidth = this.sidebarWidth;
  graphstyle = {
    position: 'absolute',
    top: '0.5em',
    bottom: '0.5rem',
    left: '0.5rem',
    right: '0.5rem',
  };

  public startTime = '1h';
  public dygStartTime: string; // used on autoUpdate
  public userStartTime = this.startTime;
  public meanS: number;
  public currentres = 0;
  public currentresText = '0s';
  public userMeanS: number;
  public automean = true;
  public fromTime: Date;
  public toTime: Date;
  public currentRange: string;

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

  appName = 'Nano4E Sensor';

  changeTrigger = 0;

  measurement = 'gas';
  ylabel = '';
  sensor = "Nano4E";
  id: string;
  interval: string;
  background: string;
  host = '';
  value = '*';
  referrer = 'I/Allsens';
  public from: number; // unix time from urlparam
  public to: number; // unix time from urlparam

  public queryRunning = false;
  public query_age: number;

  public autoreload = false;
  public auto_interval: number;
  public reload_timer = Infinity;
  public last_reload: number;

  public tableShown = false;
  public annotationsShown = false;
  public sideBarShown = true;
  public tagsShown = true;
  public allTagsShown = false;

  public Object = Object; // to use Object.hasOwn() in html

  public annotationTable = []; // [{time_t:Date, time:Date, measurement: "", tags: "", field: "", OP: "CRUD", text: "" }]

  constructor(
    public gss: GlobalSettingsService,
    private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService,
    public h: HelperFunctionsService,
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
      'automean',
      'tagsShown',
      'allTagsShown',
      'show_deviation',
    ].forEach((element) => {
      const value = this.localStorage.get(this.appName + element);
      if (value !== null) {
        this[element] = value;
      }
    });
    this.currentSidebarWidth = this.sideBarShown ? this.sidebarWidth : '0rem';
    this.reload_timer = this.auto_interval;

    // this.ls_taglist = this.localStorage.get(this.appName + 'taglist');
    // if (!this.ls_taglist) { // sometimes, ls returns "null" or so
    //   this.ls_taglist = {}
    // }

    for (const key in this.taglist) {
      if (this.taglist[key] === false) {
        this.labelBlockList.push(key);
      }
    }
    console.log('labelBlockList', this.labelBlockList);

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
      appName: "Nano4E"
    });
    if (this.interval) { // only url param supplied
      this.userMeanS = parseFloat(this.interval)
      this.automean = false;
    }

    this.meanS = this.h.calcMean(this.h.parseToSeconds(this.userStartTime), this.graphWidth);
    this.auto_interval = this.automean ? this.meanS : this.userMeanS;

    if (this.measurement.indexOf('pressure') > -1) {
      this.y2label = 'Atmospheric Pressure';
    }
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
      this.h.updateFromToTimes([this.from, this.to], this, this.interval);
      this.reload(true);
    } else {
      this.reload();
    }
    if (!this.interval) {
      this.interval = String(this.automean ? this.meanS : this.userMeanS)
    }
  }

  reload(fromTo = false) {
    this.currentres = this.automean ? this.meanS : this.userMeanS;
    this.currentresText = this.h.createHRTimeString(this.currentres);
    this.startTime = this.userStartTime;
    this.dygStartTime = fromTo ? undefined : this.startTime;

    const timerange = fromTo
      ? (this.toTime.valueOf() - this.fromTime.valueOf()) / 1000
      : this.h.parseToSeconds(this.startTime);
    const nr_points = timerange / (this.automean ? this.meanS : this.userMeanS);
    if (nr_points > 10000 && !this.h.bigQconfirm(nr_points)) {
      if (!this.labels.length) { // at start to show "no data" in Dyg Window
        this.labels = [''];
      }
      return;
    }
    if (!this.data) { // at start to show "loading... in Dyg Window"
      this.labels = [];
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

    let groupby_list = []
    if (this.taglist) {
      for (const key in this.taglist) {
        if (Object.prototype.hasOwnProperty.call(this.taglist, key)) {
          const value = this.taglist[key];
          if (value) {
            groupby_list.push('"' + key + '"')
          }
        }
      }
    }

    return this.utHTTP.influxMeanQuery(
      this.measurement,
      timeQuery,
      params,
      this.automean ? this.meanS : this.userMeanS,
      this.value,
      groupby_list.join()
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
      this.changeTrigger = 3.14 // code to tell dygraph to resize
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

    this.changeTrigger = 3.14 // code to tell dygraph to resize

    this.sortAnno("time")
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

  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);

    this.meanS = this.h.calcMean(rangeSeconds, this.graphWidth);
    this.interval = String(this.automean ? this.meanS : this.userMeanS);
    this.auto_interval = this.automean ? this.meanS : this.userMeanS;
    this.reload_timer = this.auto_interval;

    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
    this.localStorage.set(this.appName + 'userStartTime', this.userStartTime);
    this.reload();
  }
  // changeTaglist(param) {
  //   console.log(this.taglist);
  //   for (const key in this.taglist) {
  //     this.ls_taglist[key] = this.taglist[key]; // cp local taglist to ls_taglist
  //     if (this.taglist[key] === false) {
  //       if (!this.labelBlockList.includes(key)) {
  //         this.labelBlockList.push(key);
  //       }
  //     } else {
  //       if (this.labelBlockList.includes(key)) {
  //         this.labelBlockList.splice(this.labelBlockList.indexOf(key), 1);
  //       }
  //     }
  //   }
  //   this.localStorage.set(this.appName + 'taglist', this.ls_taglist);
  // }

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
  toggleAllTags() {
    this.allTagsShown = !this.allTagsShown;
    this.localStorage.set(this.appName + 'allTagsShown', this.allTagsShown);
  }
  // saveTags() {
  //   this.localStorage.set(this.appName + 'taglist', this.ls_taglist);
  // }
  // clearTags() {
  //   this.localStorage.set(this.appName + 'taglist', {});
  //   this.taglist = {}
  // }


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
    this.localStorage.set(this.appName + 'automean', this.automean);
    this.interval = String(this.automean ? this.meanS : this.userMeanS)
  }

  handleData(data: Object) {
    console.log('received', data, 'using labelBlocklist', this.labelBlockList);
    let ret = this.utHTTP.parseInfluxData(data, this.labelBlockList);
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
      this.labels = [''];
      this.repeatAutoReloadIfEnabled();
      return;
    }
    console.log('orig labels:', this.orig_labels);
    console.log('raw labels:', cloneDeep(this.raw_labels));
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
      const short_labels = ret['short_labels'];
      const raw_labels = ret['raw_labels'];

      console.log('new orig labels before R:', ret['orig_labels']);
      console.log('new raw labels before R:', cloneDeep(ret['raw_labels']));
      console.log('new common_label before R:', ret['common_label']);
      console.log('new short_labels before R:', ret['short_labels']);

      // change to R's
      for (let i = 1; i < raw_labels.length; i++) {
        const rlabel = raw_labels[i];
        const rlabeltags = rlabel.tags
        const meas_curr = parseFloat(rlabeltags["meas_current_uA"]) * 1e-6
        console.log(rlabel, rlabeltags["meas_current_uA"], meas_curr, 'A', short_labels[i - 1].replace('( V )', '( Ω )'));
        if (rlabeltags["resolution_uV"]) {
          const res_V = parseFloat(rlabeltags["resolution_uV"]) * 1e-6
          const res_Ohm = res_V / meas_curr
          rlabeltags["resolution_Ohm"] = res_Ohm
          const digits = res_Ohm > 100 ? 0 : (res_Ohm > 10 ? 1 : 2)
          short_labels[i - 1] = short_labels[i - 1].replace(/resolution_uV: [0-9.]*/, 'resolution_Ohm: ' + String(this.h.roundAccurately(res_Ohm, digits)))
        }
        if (rlabeltags["chip"] == "APPS") {
          delete rlabeltags["LED11"]
          delete rlabeltags["LED12"]
          delete rlabeltags["LED21"]
          delete rlabeltags["LED22"]
          delete rlabeltags["LED31"]
          delete rlabeltags["LED32"]
          delete rlabeltags["LED41"]
          delete rlabeltags["LED42"]
          short_labels[i - 1] = short_labels[i - 1].replace(/LED[1-4][12]: [01],/g, '')
        }

        raw_labels[i]['field'] = rlabel['field'].replace(/_V/, "_Ohm");
        short_labels[i - 1] = short_labels[i - 1].replace('( V )', '( Ω )')
        for (let r = 0; r < idata.length; r++) {
          if (meas_curr == 0) {
            idata[r][i] = NaN;
            continue;
          }
          if (idata[r][i] > 0) {
            idata[r][i] = idata[r][i] / meas_curr;
          }
        }
      }

      // for (let rli = 1; rli < raw_labels.length; rli++) { // 1 because 0 is only Date column
      //   const raw_tags = raw_labels[rli].tags;
      //   for (const key in raw_tags) {
      //     if (Object.prototype.hasOwnProperty.call(raw_tags, key)) {
      //       if (!Object.prototype.hasOwnProperty.call(this.taglist, key)) {
      //         this.taglist[key] = true;
      //       }
      //       if (!Object.prototype.hasOwnProperty.call(this.ls_taglist, key)) {
      //         this.ls_taglist[key] = true;
      //       }
      //     }
      //   }
      // }

      this.short_labels = short_labels
      this.common_label = ret['common_label'];
      this.raw_labels = raw_labels;
      this.labels = ['Date'].concat(this.short_labels);

      this.colors = this.h.getColorsforLabels(new_labels);

      for (let c = 1; c < numColumns; c++) {
        const c_label = new_labels[c];
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
      console.warn("handleData: no data");
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
          // this.reloadMissingToNow();
          this.reload();
        }
      }, this.auto_interval * 1000);
    }
  }
  handleRunningAvg(dataObj: Object) {
    this.allAverages = dataObj['all'];
    this.visibleAverages = dataObj['visible'];
  }
  private sortTimeOrderAsc = false;
  private sortOrder = {
    measurement: true,
    tags: true,
    field: true,
    note: true
  }
  sortAnno(key: string) {
    if (key == "time") {
      if (this.sortTimeOrderAsc) {
        this.annotationTable.sort((a, b) => a.time - b.time)
      } else {
        this.annotationTable.sort((a, b) => b.time - a.time)
      }
      this.sortTimeOrderAsc = !this.sortTimeOrderAsc;
      return
    }

    if (this.sortOrder[key]) {
      this.annotationTable.sort((a, b) => {
        if (a[key] > b[key]) {
          return 1
        }
        if (a[key] < b[key]) {
          return -1
        }
        return 0
      })
    } else {
      this.annotationTable.sort((a, b) => {
        if (a[key] > b[key]) {
          return -1
        }
        if (a[key] < b[key]) {
          return 1
        }
        return 0
      })
    }
    this.sortOrder[key] = !this.sortOrder[key]
  }
}
