import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-allsens',
  templateUrl: './allsens.component.html',
  styleUrls: ['./allsens.component.scss'],
})
export class AllsensComponent implements OnInit {

  userDateNow = true;

  measurements = [];
  sensors = {}; // BME: ['temperature','pressure']
  hosts = [];

  userHost = "";
  userFromValue = new Date().valueOf() - 3600000;
  userToValue = new Date().valueOf();
  userMeasurement = "";
  userSensor = "";
  userInterval: number;
  userId = "";
  userValue = "*";
  userMinute = 0;
  userHour = 0;

  // Time Range
  userStartTime = "1h"; 
  userIntSeconds = 1;

  userAvgTime = "1s"
  

  public toFormDate = new FormControl(new Date());

  constructor(
    private globalSettings: GlobalSettingsService,
    private utHTTP: UtFetchdataService,
    private h: HelperFunctionsService
  ) {
    this.globalSettings.emitChange({ appName: 'All Sensors' });
  }
  ngOnInit() {
    this.launchQuery('show series');
    const now = new Date();
    this.userHour = now.getHours();
    this.userMinute = now.getMinutes();
    this.userIntSeconds = this.h.parseToSeconds(this.userStartTime);
    this.userInterval = this.h.parseToSeconds(this.userAvgTime);
    this.userFromValue = this.userToValue - (this.userIntSeconds * 1000);
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

      if (!this.sensors_per_m[measurement]) this.sensors_per_m[measurement] = [];

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
        const id = seri.match(/id=([-A-Za-z0-9|]*)/)[1];
        this.tagsets_per_m_s[measurement][sname].push({ id: id, tags: this_series_tags.join(", ") });

      }
      const host = seri.match(/host=([-A-Za-z0-9]*)/);
      if (host && host[1] && !this.hosts.includes(host[1])) {
        this.hosts.push(host[1]);
        this.userHost = host[1]; // auto-select last
      }

      console.log(this.tagsets_per_m_s);
    }


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
  toDatePickerChanged($event) { }
  changeUserDateNow($event) { }
  calcTime($event) { }
  changeInterval($event) {
    this.userInterval = this.h.parseToSeconds(this.userAvgTime);
   }
  changeUserStartTime($event) {
    this.userIntSeconds = this.h.parseToSeconds(this.userStartTime);
    this.userFromValue = this.userToValue - (this.userIntSeconds * 1000);
  }
}
