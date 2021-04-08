import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';
import { geoJSON, circleMarker } from 'leaflet';

@Component({
  selector: 'app-gps',
  templateUrl: './gps.component.html',
  styleUrls: ['./gps.component.scss'],
})
export class GpsComponent implements OnInit {
  public options = {};

  public appName = 'GPS';

  public displayed_line = {};
  public displayed_points = {};

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
      'SELECT * FROM location WHERE time > now() - ' + this.startTime;
    this.launchQuery(queries);
  }
  handleData(data: Object) {
    console.log('received', data);
    let ret = this.utHTTP.parseInfluxData(data);
    console.log('parsed', ret);
    const labels = ret['labels'];
    const idata = ret['data'];

    let latcol = -1;
    let loncol = -1;
    for (let i = 1; i < labels.length; i++) {
      const element = labels[i];
      const lonmatch = element.match(/\blon\b/);
      if (lonmatch && lonmatch.length > 0 && lonmatch[0] == 'lon') {
        loncol = i;
        console.log('loncol', i);
        continue

      }
      const latmatch = element.match(/\blat\b/);
      if (latmatch && latmatch.length > 0 && latmatch[0] == 'lat') {
        latcol = i;
        console.log('latcol', i);
      }
    }



    let line: GeoJSON.Feature<any> = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [],
      },
    };
    // let points: GeoJSON.FeatureCollection<any> = {
    //   type: 'FeatureCollection',
    //   features: [],
    // };

    // for (let i = 0; i < idata.length; i++) {
    //   const element = idata[i];
    //   if (element[1] == 0 || element[2] == 0) continue;
    //   line.geometry.coordinates.push([element[2], element[1]]);
    //   const point: GeoJSON.Feature<any> = {
    //     type: 'Feature' as const,
    //     properties: { date: element[0] },
    //     geometry: {
    //       type: 'Point',
    //       coordinates: [element[loncol], element[latcol]],
    //     },
    //   };
    //   points.features.push(point);
    // }
    this.displayed_line = line;
    // this.displayed_points = points; // FIXME TODO implement again, also for enviromap!!!!
    const geojsonMarkerOptions = {
      radius: 3,
      fillColor: '#ff780080',
      color: '#ff7800',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8,
    };
    this.layers[0] = geoJSON(this.h.influx2geojsonPoints(idata, labels), {
      pointToLayer: function (feature, latlng) {
        return circleMarker(latlng, geojsonMarkerOptions);
      },
      onEachFeature: this.h.leafletPopup,
    });
    console.log('layers:', this.layers);

    this.startTime = this.userStartTime;
    this.labels = labels;
    this.data = idata;
    console.log(labels);
    console.log(idata);
  }
  exportGeojson() {
    this.h.exportGeojson(this.displayed_points);
  }
}
