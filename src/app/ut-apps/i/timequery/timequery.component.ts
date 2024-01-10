import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';
import { FormControl } from '@angular/forms';
import { LocalStorageService } from 'app/core/local-storage.service';

@Component({
  selector: 'app-timequery',
  templateUrl: './timequery.component.html',
  styleUrls: ['./timequery.component.scss'],
})
export class TimequeryComponent implements OnInit {

  userDateNow = true;

  measurements = [];
  sensors = {}; // BME: ['temperature','pressure']
  hosts = [];

  userHost = "";
  userFromValue = new Date().valueOf() - 3600000;
  userToValue = new Date().valueOf();
  userMeasurement = "";
  userSensor = "";
  userAvgIntervalSeconds: number;
  intervalString: string;
  userId = "";
  userValue = "*";
  userMinute = 0;
  userHour = 0;

  // Time Range
  userTimeRange = "1h";
  userTimeRangeSeconds = 1;
  timeRangeString: string;

  userAvgInterval = "1s"


  public toFormDate: FormControl;

  appName = 'History Time Query Interface';

  constructor(
    private globalSettings: GlobalSettingsService,
    private utHTTP: UtFetchdataService,
    private localStorage: LocalStorageService,
    private h: HelperFunctionsService
  ) {
    this.globalSettings.emitChange({ appName: this.appName });
  }
  ngOnInit() {
    [
      'userHost',
      'userHour',
      'userMinute',
      'userTimeRange',
      'userAvgInterval',
      'userDateNow',
      'toFormDate'
    ].forEach((element) => {
      const thing = this.localStorage.get(this.appName + element);
      if (thing !== null) {
        console.log('LS', element, thing);

        if (element == 'toFormDate') {
          const newToDate = new Date(thing)
          this.toFormDate = new FormControl(newToDate);
          this.userToValue = newToDate.valueOf();
        } else {
          this[element] = thing;
        }
      }
    });
    if (!this.toFormDate) {
      this.toFormDate = new FormControl(new Date());
    } else {
      const newToDateWHM = new Date(this.userToValue)
      newToDateWHM.setHours(this.userHour);
      newToDateWHM.setMinutes(this.userMinute);
      this.userToValue = newToDateWHM.valueOf();
    }

    this.launchQuery('show series');
    const now = new Date();
    if (!this.userHour)
      this.userHour = now.getHours();
    if (!this.userMinute)
      this.userMinute = now.getMinutes();

    this.userTimeRangeSeconds = this.h.parseToSeconds(this.userTimeRange);
    this.userAvgIntervalSeconds = this.h.parseToSeconds(this.userAvgInterval);
    this.userFromValue = this.userToValue - (this.userTimeRangeSeconds * 1000);

    if (this.userDateNow) {
      this.setCurrentDates();
    }
    this.intervalString = this.h.createHRTimeString(this.userAvgIntervalSeconds);
    this.timeRangeString = this.h.createHRTimeString(this.userTimeRangeSeconds);
  }

  launchQuery(clause: string) {
    if (!this.globalSettings.influxReady()) {
      setTimeout(() => {
        this.launchQuery(clause);
      }, 1000);
      return;
    }
    const q = this.utHTTP.buildInfluxQuery(clause);
    this.utHTTP.getHTTPData(q).subscribe(
      (data: Object) => this.handleData(data),
      (error) => this.globalSettings.displayHTTPerror(error)
    );
  }

  public key_ignore_list = ['host', 'topic', 'sensor', 'id'];
  public tagsets_per_m_s = {}; // { $m: { $sensor: [ { id: $id, tags: tagset}, { } ] } }
  public sensors_per_m = {} // { $m: [] }
  handleData(data: Object) {
    // console.log('received', data);
    const series = this.h.getDeep(data, ['results', 0, 'series', 0, 'values']);
    console.log('series', series);
    for (let i = 0; i < series.length; i++) {
      const seri = series[i][0];
      const m_and_tags = seri.split(',')
      const measurement = m_and_tags[0];
      if (measurement == 'calibrations') {
        continue;
      }
      if (!this.measurements.includes(measurement)) {
        this.measurements.push(measurement);
      }

      if (!this.sensors_per_m[measurement]) this.sensors_per_m[measurement] = [""];

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

      const sensor = seri.match(/sensor=([-A-Za-z0-9|]*)/);
      if (sensor && sensor[1]) {
        const sname = sensor[1];
        if (!this.sensors[sname]) this.sensors[sname] = [];
        if (!this.sensors[sname].includes(measurement))
          this.sensors[sname].push(measurement);
        if (!this.sensors_per_m[measurement].includes(sname))
          this.sensors_per_m[measurement].push(sname)

        if (!this.tagsets_per_m_s[measurement]) {
          this.tagsets_per_m_s[measurement] = {}
        }
        if (!this.tagsets_per_m_s[measurement][sname]) {
          this.tagsets_per_m_s[measurement][sname] = []
        }
        const idmatch = seri.match(/id=([-A-Za-z0-9|]*)/)

        const id = idmatch ? idmatch[1] : "NO_ID";
        this.tagsets_per_m_s[measurement][sname].push({ id: id, tags: this_series_tags.join(", ") });

      }
      // const host = seri.match(/host=([-A-Za-z0-9]*)/);
      const host = seri.match(/host=([^,]*)/);
      if (host && host[1] && !this.hosts.includes(host[1])) {
        this.hosts.push(host[1]);
        this.userHost = host[1]; // auto-select last (maybe overwritten from ls)
      }

      console.log(this.tagsets_per_m_s);
    }
    const lshost = this.localStorage.get(this.appName + 'userHost');
    if (lshost)
      this.userHost = lshost;

    const q = this.utHTTP.buildInfluxQuery("show field keys on " + this.globalSettings.server.influxdb);
    this.utHTTP.getHTTPData(q).subscribe(
      (data: Object) => this.handleFieldKeys(data),
      (error) => this.globalSettings.displayHTTPerror(error)
    );
  }

  public fieldKeys = {} // # { $M: [] }
  handleFieldKeys(data) {
    console.log("handleFieldKeys");

    console.log(data);
    const series = this.h.getDeep(data, ['results', 0, 'series']);
    console.log('series', series);

    for (let i = 0; i < series.length; i++) {
      const element = series[i];
      const m = element['name'];
      this.fieldKeys[m] = ["*"];
      element['values'].forEach(fk => {
        if (fk[1] == 'float' || fk[1] == 'integer') {
          this.fieldKeys[m].push(fk[0])
        }
      });

    }
    console.log(this.fieldKeys);
  }
  saveHost($event) {
    this.localStorage.set(this.appName + 'userHost', this.userHost);
  }


  toDatePickerChanged($event) {
    const newTo = $event['value'];
    if (!newTo) return;
    const toSetDate = new Date(newTo.valueOf());
    toSetDate.setHours(this.userHour);
    toSetDate.setMinutes(this.userMinute);
    this.userToValue = toSetDate.valueOf();
    this.userFromValue = this.userToValue - (this.userTimeRangeSeconds * 1000);
    this.localStorage.set(this.appName + 'toFormDate', newTo);
  }
  changeUserDateNow($event) {
    if (this.userDateNow) {
      this.setCurrentDates()
    } else {
      const toSetDate = new Date(this.toFormDate.value);
      toSetDate.setHours(this.userHour);
      toSetDate.setMinutes(this.userMinute);
      this.userToValue = toSetDate.valueOf();
      this.userFromValue = this.userToValue - (this.userTimeRangeSeconds * 1000);
    }
    this.localStorage.set(this.appName + 'userDateNow', this.userDateNow);
  }
  calcTime($event) {
    const newDate = new Date(this.userToValue);
    newDate.setHours(this.userHour);
    newDate.setMinutes(this.userMinute);
    this.userToValue = newDate.valueOf();

    this.userFromValue = this.userToValue - (this.userTimeRangeSeconds * 1000);
    this.localStorage.set(this.appName + 'userHour', this.userHour);
    this.localStorage.set(this.appName + 'userMinute', this.userMinute);
  }
  changeUserAvgIntervalSeconds($event) {
    this.intervalString = this.h.createHRTimeString(this.userAvgIntervalSeconds);
  }
  changeUserAvgInterval($event) {
    this.userAvgIntervalSeconds = this.h.parseToSeconds(this.userAvgInterval);
    this.changeUserAvgIntervalSeconds(null);
    this.localStorage.set(this.appName + 'userAvgInterval', this.userAvgInterval);
  }
  changeUserTimeRange($event) {
    this.userTimeRangeSeconds = this.h.parseToSeconds(this.userTimeRange);
    this.changeUserTimeRangeSeconds(null);
    this.localStorage.set(this.appName + 'userTimeRange', this.userTimeRange);
  }
  changeUserTimeRangeSeconds($event) {
    this.userFromValue = this.userToValue - (this.userTimeRangeSeconds * 1000);
    this.timeRangeString = this.h.createHRTimeString(this.userTimeRangeSeconds);
  }
  setCurrentDates() {
    this.userToValue = new Date().valueOf();
    this.userFromValue = this.userToValue - (this.userTimeRangeSeconds * 1000);
    if (this.userDateNow) {
      setTimeout(() => {
        this.setCurrentDates();
      }, 1000);
    }
  }
}
