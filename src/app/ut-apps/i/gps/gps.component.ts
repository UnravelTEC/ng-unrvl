import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';
import { geoJSON } from 'leaflet';

@Component({
  selector: 'app-gps',
  templateUrl: './gps.component.html',
  styleUrls: ['./gps.component.scss'],
})
export class GpsComponent implements OnInit {
  public options = {};

  public appName = 'GPS';

  public displayed_line = {};

  public startTime = '1h';
  public userStartTime = this.startTime;
  public meanS = 1;
  public currentres = 0;
  public userMeanS = this.meanS;
  public fromTime: Date;
  public toTime: Date;
  public currentRange: string;
  updateFromToTimes(timearray) {
    // console.log(timearray);
    this.fromTime = new Date(timearray[0]);
    this.toTime = new Date(timearray[1]);
    const rangeSeconds = Math.floor((timearray[1] - timearray[0]) / 1000);
    this.currentRange = this.h.createHRTimeString(rangeSeconds);
    this.userMeanS = this.calcMean(rangeSeconds);
  }
  calcMean(secondsRange) {
    return 1;
  }
  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);

    this.userMeanS = this.calcMean(rangeSeconds);

    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
    this.localStorage.set(this.appName + 'userStartTime', this.userStartTime);
    this.reload();
  }

  launchQuery(clause: string) {
    this.utHTTP
      .getHTTPData(this.utHTTP.buildInfluxQuery(clause))
      .subscribe((data: Object) => this.handleData(data));
  }
  saveMean(param) {
    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
  }

  labels = [];
  data = [];

  changeTrigger = true;

  measurement = 'location';
  sensor = '';
  host = '';

  constructor(
    private globalSettings: GlobalSettingsService,
    private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService,
    private h: HelperFunctionsService
  ) {
    this.globalSettings.emitChange({ appName: 'GPS' });
  }

  ngOnInit(): void {
    this.reload();
  }

  public layers = [];

  reload() {
    this.meanS = this.userMeanS;
    this.currentres = this.meanS;
    this.startTime = this.userStartTime;

    const timeQuery = this.utHTTP.influxTimeString(this.startTime);

    let params = { sensor: [] };

    let queries = this.utHTTP.influxMeanQuery(
      this.measurement,
      timeQuery,
      params,
      this.meanS
    );
    queries =
      'SELECT lat,lon FROM location WHERE time > now() - ' + this.startTime;
    this.launchQuery(queries);
  }
  handleData(data: Object) {
    console.log('received', data);
    let ret = this.utHTTP.parseInfluxData(data);
    console.log('parsed', ret);
    const labels = ret['labels'];
    const idata = ret['data'];

    let line: GeoJSON.Feature<any> = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [],
      },
    };
    for (let i = 0; i < idata.length; i++) {
      const element = idata[i];
      if (element[1] == 0 || element[2] == 0) continue;
      line.geometry.coordinates.push([element[2], element[1]]);
    }
    this.layers[0] = geoJSON(line);
    console.log('layers:', this.layers);

    this.startTime = this.userStartTime;
    this.labels = labels;
    this.data = idata;
    console.log(labels);
    console.log(idata);
  }
}
