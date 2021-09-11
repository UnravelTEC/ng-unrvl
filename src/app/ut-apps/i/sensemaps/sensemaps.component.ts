import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';

@Component({
  selector: 'app-sensemaps',
  templateUrl: './sensemaps.component.html',
  styleUrls: ['./sensemaps.component.scss'],
})
export class SensemapsComponent implements OnInit {
  measurements = [];
  sensors = {}; // BME: ['temperature','pressure']
  hosts = [];

  public queryRunning = false;
  public errorText = '';

  constructor(
    private globalSettings: GlobalSettingsService,
    private utHTTP: UtFetchdataService,
    private h: HelperFunctionsService
  ) {
    this.globalSettings.emitChange({ appName: 'Geospatial Sensor Data' });
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
    this.queryRunning = true;
    const q = this.utHTTP.buildInfluxQuery(clause);
    this.utHTTP.getHTTPData(q).subscribe(
      (data: Object) => this.handleData(data),
      (error) => {
        this.queryRunning = false;
        this.globalSettings.displayHTTPerror(error);
      }
    );
  }

  handleData(data: Object) {
    // console.log('received', data);
    const series = this.h.getDeep(data, ['results', 0, 'series', 0, 'values']);
    console.log('series', series);
    for (let i = 0; i < series.length; i++) {
      const seri = series[i][0];
      const measurement = seri.split(',')[0];
      if (!this.measurements.includes(measurement)) {
        this.measurements.push(measurement);
      }
      const sensor = seri.match(/sensor=([-A-Za-z0-9|]*)/);
      if (sensor && sensor[1]) {
        const sname = sensor[1];
        if (!this.sensors[sname]) this.sensors[sname] = [];
        if (!this.sensors[sname].includes(measurement))
          this.sensors[sname].push(measurement);
      }
      const host = seri.match(/host=([-A-Za-z0-9]*)/);
      if (host && host[1] && !this.hosts.includes(host[1])) {
        this.hosts.push(host[1]);
      }
    }
    this.queryRunning = false;
  }
}
