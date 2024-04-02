import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';
import { LocalStorageService } from 'app/core/local-storage.service';

@Component({
  selector: 'app-allsens',
  templateUrl: './allsens.component.html',
  styleUrls: ['./allsens.component.scss'],
})
export class AllsensComponent implements OnInit {


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

  appName = 'All Sensors';

  constructor(
    private globalSettings: GlobalSettingsService,
    private utHTTP: UtFetchdataService,
    private localStorage: LocalStorageService,
    private h: HelperFunctionsService
  ) {
    this.globalSettings.emitChange({ appName: this.appName });
  }
  ngOnInit() {
    this.launchQuery('show series');
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
      if (measurement == 'calibrations' || measurement == 'annotations') {
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

    let querystring = "";
    for (const sname in this.sensors) {
      if (Object.prototype.hasOwnProperty.call(this.sensors, sname)) {
        const measurements = this.sensors[sname];
        measurements.forEach(measurement => {
          querystring += "SELECT * from " + measurement + " WHERE sensor='" + sname + "' ORDER BY time DESC LIMIT 1; "
        });
      }
    }
    const q = this.utHTTP.buildInfluxQuery(querystring);
    this.utHTTP.getHTTPData(q).subscribe(
      (data: Object) => this.handlelatestSensorTSs(data),
      (error) => this.globalSettings.displayHTTPerror(error)
    );
  }

  public latest_sensorSeconds = {} // # { $Sensor: { $measurement: latest_TS } }
  handlelatestSensorTSs(data) {
    const uts = Date.now().valueOf()
    console.log("handlelatestSensorTSs");

    console.log(data);
    const series = data['results'];
    // console.log('series', series);

    for (let i = 0; i < series.length; i++) {
      const seri = series[i]['series'][0];
      const sensorcol = seri['columns'].indexOf('sensor')
      // console.log(seri, sensorcol);

      if (sensorcol > 0) {
        const sensor = seri['values'][0][sensorcol]
        if (!this.latest_sensorSeconds[sensor]) this.latest_sensorSeconds[sensor] = {};
        this.latest_sensorSeconds[sensor][seri['name']] = this.h.createHRTimeString(Math.round((uts - seri['values'][0][0]) / 1000));
      }
    }
    console.log(this.latest_sensorSeconds);
  }

}

