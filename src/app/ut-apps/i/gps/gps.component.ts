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

  public minmax = { min: Infinity, max: -Infinity };
  public queryRunning = false;

  // public displayed_line = {};
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
    this.queryRunning = true;
    if (!this.globalSettings.influxReady()) {
      this.globalSettings.emitChange({ status: 'Waiting for Influx Connection to finish...' });
      setTimeout(() => {
        this.launchQuery(clause);
      }, 1000);
      return;
    }
    this.globalSettings.emitChange({ status: 'Influx query in progress...' });
    this.utHTTP
      .getHTTPData(this.utHTTP.buildInfluxQuery(clause))
      .subscribe((data: Object) => this.handleData(data),
      (error) => this.globalSettings.displayHTTPerror(error)
      );
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
    this.globalSettings.emitChange({ status: 'Creating Influx query...' });
    this.meanS = this.userMeanS;
    this.currentres = this.meanS;
    this.startTime = this.userStartTime;

    const timerange = this.h.parseToSeconds(this.startTime);
    const nr_points = timerange / this.meanS;
    if (nr_points > 10000 && !this.h.bigQconfirm(nr_points)) {
      if (!this.labels.length) {
        // at start to show "no data"
        this.labels = [''];
      }
      return;
    }

    const timeQuery = this.utHTTP.influxTimeString(this.startTime);

    let params = { sensor: [] };

    let queries = this.utHTTP.influxMeanQuery(
      this.measurement,
      timeQuery,
      params,
      this.meanS
    );
    queries = 'SELECT * FROM location WHERE time > now() - ' + this.startTime;
    this.launchQuery(queries);
  }
  handleData(data: Object) {
    this.globalSettings.emitChange({ status: 'Influx data received, parsing...' });
    console.log('received', data);
    let ret = this.utHTTP.parseInfluxData(data);
    if (ret['error']) {
      alert('Influx Error: ' + ret['error']);
      this.queryRunning = false;
      this.globalSettings.emitChange({ status: '' });
      return;
    }
    console.log('parsed', ret);
    const labels = ret['labels'];
    const idata = ret['data'];
    this.globalSettings.emitChange({ status: 'Parsing geo data...' });
    let latcol = -1;
    let loncol = -1;
    const nrCols = labels.length; // for speed
    let colorColumn: Number;
    let speedColumn: Number;
    for (let i = 1; i < nrCols; i++) {
      const element = labels[i];

      if (element.search('speed')) {
        colorColumn = i;
      }
      if (element.search('speed')) {
        speedColumn = i;
      }

      const lonmatch = element.match(/\blon\b/);
      if (lonmatch && lonmatch.length > 0 && lonmatch[0] == 'lon') {
        loncol = i;
        console.log('loncol', i);
        continue;
      }
      const latmatch = element.match(/\blat\b/);
      if (latmatch && latmatch.length > 0 && latmatch[0] == 'lat') {
        latcol = i;
        console.log('latcol', i);
        continue
      }
      labels[i] = element.replace(/location /,'');
    }

    // let line: GeoJSON.Feature<any> = {
    //   type: 'Feature' as const,
    //   properties: {},
    //   geometry: {
    //     type: 'LineString',
    //     coordinates: [],
    //   },
    // };
    // this.displayed_line = line;

    let max = 20;
    let min = 0;
    for (let r = 0; r < idata.length; r++) {
      const row = idata[r];

      for (let c = 1; c < nrCols; c++) {
        const element = row[c];
        if (c == colorColumn) {
          if (max < element) {
            max = element;
          } else if (min > element) {
            min = element;
          }
        }
      }
    }
    labels.push('Speed ( km / h )'); // small spaces
    labels.push('color');
    const range = max - min;
    console.log('for', 'hdop', 'min:', min, 'max:', max, 'range', range);
    for (let r = 0; r < idata.length; r++) {
      const row = idata[r];
      for (let c = 1; c < nrCols; c++) {
        const element = row[c];
        if (c == speedColumn) {
          row.push(element * 3.6)
        }
        if (c == colorColumn) {
          const percentage = ((element - min) / range) * 100;
          row.push(this.h.returnColorForPercent(percentage));
          break;
        }
      }
    }

    const geojsonMarkerOptions = {
      radius: 2,
      // fillColor: '#0000ff80',
      color: '#0000ff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8,
    };
    let points = this.h.influx2geojsonPoints(idata, labels);
    this.displayed_points = points;
    this.globalSettings.emitChange({ status: 'Creating map data layer' });
    this.layers[0] = geoJSON(points, {
      pointToLayer: function (feature, latlng) {
        if (feature.properties['color']) {
          geojsonMarkerOptions.color = feature.properties.color;
        }
        return circleMarker(latlng, geojsonMarkerOptions);
      },
      onEachFeature: this.h.leafletPopup,
    });
    console.log('layers:', this.layers);

    this.startTime = this.userStartTime;
    this.labels = labels;
    this.data = idata;
    if (this.data.length) {
      this.updateFromToTimes([this.data[0][0].valueOf(), this.data[this.data.length - 1][0].valueOf()])
    }
    console.log(labels);
    console.log(idata);
    this.queryRunning = false;
    this.globalSettings.emitChange({ status: '' });
  }
  exportGeojson() {
    this.h.exportGeojson(this.displayed_points);
  }
}
