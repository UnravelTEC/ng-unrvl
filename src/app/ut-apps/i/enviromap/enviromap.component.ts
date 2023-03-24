import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';
import { geoJSON, circleMarker } from 'leaflet';
import { ActivatedRoute } from '@angular/router';
import { cloneDeep } from 'lodash-es';
import { LocalStorageService } from 'app/core/local-storage.service';
import { SensorService } from 'app/shared/sensor.service';

@Component({
  selector: 'app-enviromap',
  templateUrl: './enviromap.component.html',
  styleUrls: ['./enviromap.component.scss'],
})
export class EnviromapComponent implements OnInit, OnDestroy {
  public appName = 'Enviromap';
  constructor(
    private globalSettings: GlobalSettingsService,
    private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService,
    public h: HelperFunctionsService,
    private router: ActivatedRoute,
    private sensorService: SensorService
  ) {
    this.globalSettings.emitChange({ appName: this.appName });
    for (let i = 99; i > 1; i -= 2) {
      this.barArray.push(i);
      this.barValues.push(String(i) + ' %');
    }
  }
  colors = [];
  graphWidth = 1900;
  setGraphWidth(width) {
    this.graphWidth = width;
    console.log('new w', width);
  }
  extraDyGraphConfig = {
    connectSeparatedPoints: true,
    pointSize: 3,
    logscale: false,
    series: {
      'pressure sensor: BME280, pressure (hPa)': {
        axis: 'y2',
      },
    },
    y2label: 'Atmospheric Pressure (hPa)',
    axes: {
      y2: {
        independentTicks: true, // default opt here to have a filled object to access later
        // axisLabelWidth: 60, // set on demand
      },
    },
  };
  labelBlackListT = [
    'host',
    'serial',
    'mean_*',
    'id',
    'sensor',
    'topic',
    'interval_s',
  ];
  graphstyle = {
    position: 'absolute',
    top: '70%',
    bottom: '0.5rem',
    left: '0.5rem',
    right: '0.5rem',
  };

  measurement = 'temperature';
  sensor: String;
  interval: string;
  host = '';
  referrer = 'Bimbox001';
  id: String;
  value = '*';

  db = 'bimbox001';
  server = 'https://newton.unraveltec.com';

  labels = [];
  raw_graphlabels = [];
  round_graphdigits = [0];
  unit = '?';
  data = [];
  gpsdata = [];
  gpslabels = [];
  public displayed_points = {};
  public layers = [];
  public Infinity = Infinity; // hack to allow use in .html

  public startTime = '1h';
  public userStartTime = this.startTime;
  public meanS = 0.1;
  public currentres = 0;
  public userMeanS = this.meanS;
  public fromTime: Date;
  public from: Number; // unix time from urlparam
  public toTime: Date;
  public to: Number; // unix time from urlparam
  public queryRunning = false;
  // public changeTrigger = true;

  public highlightDate: Date;
  public highlightValue: number;

  public currentRange: string;
  public column: String; //searchstring - if a label matches, this column is used for coloring the markers
  public colorramp = [
    'green:#00FF00',
    'yellow:#FFFF00',
    'orange:#FFA600',
    'red:#FF0000',
    'violet:#800080',
  ];
  barArray = [];
  barColors = [];
  barValues = [];
  begincolor = 'black';
  endcolor = 'black';

  public sideBarShown = true;

  public minmax = { min: Infinity, max: -Infinity, smin: 'from', smax: 'to' }; // s*: string, for view
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

  ngOnInit(): void {
    ['userMeanS', 'userStartTime', 'sideBarShown'].forEach((element) => {
      const thing = this.localStorage.get(this.appName + element);
      if (thing !== null) {
        this[element] = thing;
      }
    });
    // this.globalSettings.emitChange({ fullscreen: true });
    [
      'host',
      'measurement',
      'sensor',
      'referrer',
      'id',
      'value',
      'from',
      'to',
      'column',
      'interval',
    ].forEach((element) => {
      const thing = this.router.snapshot.queryParamMap.get(element);
      if (thing) {
        this[element] = thing;
      }
    });
    this.userMeanS = this.calcMean(this.h.parseToSeconds(this.startTime));
    if (this.from && this.to) {
      this.from = Number(this.from);
      this.to = Number(this.to);
      this.updateFromToTimes([this.from, this.to], this.interval);
      this.reload(true);
    } else {
      this.reload();
    }
    for (let i = 0; i < this.barArray.length; i++) {
      this.barColors[i] = this.h.returnColorForPercent(this.barArray[i]);
    }
    this.begincolor = this.h.returnColorForPercent(0);
    this.endcolor = this.h.returnColorForPercent(100);
  }
  reload(fromTo = false) {
    this.meanS = this.userMeanS;
    this.currentres = this.meanS;
    this.startTime = this.userStartTime;

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
    this.queryRunning = true;

    const timeQuery = fromTo
      ? this.utHTTP.influxTimeString(this.fromTime, this.toTime)
      : this.utHTTP.influxTimeString(this.startTime);

    let params = { sensor: [] };
    if (this.sensor) {
      if (Array.isArray(this.sensor)) {
        params['sensor'] = this.sensor;
      } else {
        params['sensor'] = [this.sensor];
      }
    }
    if (this.host) {
      params['host'] = this.host;
    }
    if (this.id) {
      params['id'] = this.id;
    }

    let queries =
      this.utHTTP.influxMeanQuery(
        this.measurement,
        timeQuery,
        params,
        this.meanS,
        this.value
      ) +
      this.utHTTP.influxMeanQuery(
        'location',
        timeQuery,
        {},
        this.meanS,
        '/lat|lon/'
      );
    // 'SELECT lat,lon FROM location WHERE ' +
    // timeQuery;

    this.launchQuery(queries);
  }

  calcMean(secondsRange) {
    const divider = Math.floor(secondsRange / this.graphWidth);
    return divider > 1 ? divider : 1;
  }
  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);

    this.userMeanS = this.calcMean(rangeSeconds);

    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
    this.localStorage.set(this.appName + 'userStartTime', this.userStartTime);
    this.reload();
  }

  launchQuery(clause: string) {
    if (!this.globalSettings.influxReady()) {
      setTimeout(() => {
        this.launchQuery(clause);
      }, 1000);
      return;
    }
    this.utHTTP
      .getHTTPData(
        this.utHTTP.buildInfluxQuery(clause) //, this.db, this.server)
        // 'bimweb',
        // 'D,OEZ4UL+[hGgMQA(@<){W[kd'
      )
      .subscribe(
        (data: Object) => this.handleData(data),
        (error) => this.globalSettings.displayHTTPerror(error)
      );
  }
  saveMean(param) {
    // this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
  }

  handleData(data: Object) {
    console.log('received', data);
    let ret = this.utHTTP.parseInfluxData(data, this.labelBlackListT);
    console.log('parsed', ret);
    if (ret['error']) {
      alert('Influx Error: ' + ret['error']);
      this.queryRunning = false;
      // this.data = [];
      // this.labels = ['']; // to signalise no data
      return;
    }
    const labels = ret['labels'];
    if (labels.length < 4) {
      // date, lat, lon
      console.log('not enough data columns received', labels);
      this.queryRunning = false;
      this.data = [];
      this.labels = ['']; // to signalise no data
      return;
    }
    const idata = ret['data'];

    let logscale = true;
    const newColors = this.h.getColorsforLabels(labels);
    if (!this.column) {
      if (labels.length == 4) {
        // Date, (lat, lon, value in any order)
        for (let i = 1; i < labels.length; i++) {
          if (!labels[i].startsWith('location') && !(labels[i].endsWith('lat') || labels[i].endsWith('lon'))) {
            this.column = labels[i];
            console.log('only 1 data column, use', this.column, 'for colors');
          }
        }
      }
    }

    let colorColumn: Number;
    for (let c = 1; c < labels.length; c++) {
      const item = labels[c];
      console.log('scan: column', c, '="' + item + '"');

      if (logscale == true) {
        for (let r = 0; r < idata.length; r++) {
          const point = idata[r][c];
          if (point <= 0 && !Number.isNaN(point) && point !== null) {
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
      if (item.match(/pressure/)) {
        this.extraDyGraphConfig.axes.y2['axisLabelWidth'] = 60;
      }
      if (item.search(this.column) > -1 || item == this.column) {
        // || needed, does not match if the same?? at least for "temperature sensor ( °C )"
        colorColumn = c;
        console.log('using', labels[c], 'as color column');
      }
    }
    // console.log(cloneDeep(this.dygLabels));
    if (logscale) {
      console.log('scale: log');
      this.extraDyGraphConfig.logscale = logscale;
    } else {
      console.log('scale: lin');
    }
    this.startTime = this.userStartTime;

    const geojsonMarkerOptions = {
      radius: 2,
      // fillColor: '#0000ff80',
      color: '#0000ff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8,
    };
    const lastmarkerOptions = cloneDeep(geojsonMarkerOptions);
    lastmarkerOptions.radius = 6;
    lastmarkerOptions.fillOpacity = 0.5;
    lastmarkerOptions.color = '#000000';

    const graphlabels = [];
    const graphdata = [];

    const raw_graphlabels = [];
    const round_graphdigits = [0];
    let latlabelpos: number, lonlabelpos: number;
    for (let i = 0; i < labels.length; i++) {
      const element = labels[i];
      if (element.startsWith('location') && element.endsWith('lat')) {
        latlabelpos = i;
      } else if (element.startsWith('location') && element.endsWith('lon')) {
        lonlabelpos = i;
      } else {
        graphlabels.push(element);
        raw_graphlabels.push(ret['raw_labels'][i]);
        round_graphdigits.push(
          this.sensorService.getDigits(ret['raw_labels'][i])
        );
      }
    }
    console.log('round_graphdigits', round_graphdigits);

    let labelunit = graphlabels[1].match(/\(\s?(.*)\s?\)$/);
    this.unit = labelunit && labelunit[1] ? labelunit[1] : this.unit;
    let max = -Infinity;
    let min = Infinity;
    for (let r = 0; r < idata.length; r++) {
      const row = idata[r];
      let newgrow = [row[0]];
      let isValidRow = false;
      for (let c = 1; c < row.length; c++) {
        const element = row[c];
        if (c == latlabelpos) {
          // newmrow[1] = element; //unused
          true;
        } else if (c == lonlabelpos) {
          // newmrow[2] = element;//unused
          true;
        } else {
          newgrow.push(element);
          if (element === null || isNaN(element)) {
            // delete row[c];
            // row[c] = NaN;
            continue;
          } else {
            isValidRow = true;
          }
        }
        if (c == colorColumn) {
          if (max < element) {
            max = element;
          } else if (min > element) {
            min = element;
          }
        }
      }
      if (isValidRow) {
        graphdata.push(newgrow);
      }
      // mapdata.push(newmrow);//unused
    }
    console.log('found min:', min, 'max:', max);

    this.minmax.max = this.h.roundAccurately(max, round_graphdigits[1]);
    this.minmax.min = this.h.roundAccurately(min, round_graphdigits[1]);
    this.minmax.smax = this.h.shortenNumber(this.minmax.max, 1);
    this.minmax.smin = this.h.shortenNumber(this.minmax.min, 1);
    if (this.column) {
      labels.push('color');
      const range = max - min;
      for (let i = 0; i < this.barArray.length; i++) {
        this.barValues[i] =
          String(
            this.h.roundAccurately(
              min + (range * this.barArray[i]) / 100,
              round_graphdigits[1]
            )
          ) +
          ' ' +
          this.unit;
      }
      console.log('for', this.column, 'min:', min, 'max:', max, 'range', range);
      for (let r = 0; r < idata.length; r++) {
        const row = idata[r];
        for (let c = 1; c < row.length; c++) {
          if (c == colorColumn) {
            const element = row[c];
            if (element !== null) {
              const percentage = ((element - min) / range) * 100;
              row.push(this.h.returnColorForPercent(percentage));
            } else {
              row.push('gray');
            }
            break;
          }
        }
      }
    }

    let points = this.h.influx2geojsonPoints(idata, labels);
    this.displayed_points = points;
    this.layers[0] = geoJSON(points, {
      pointToLayer: function (feature, latlng) {
        if (feature.properties['color']) {
          geojsonMarkerOptions.color = feature.properties.color;
        }
        return circleMarker(latlng, geojsonMarkerOptions);
      },
      onEachFeature: this.h.leafletPopup,
    });

    // highlight Last Point
    this.layers[1] = geoJSON(
      this.h.influx2geojsonPoints([idata[idata.length - 1]], labels),
      {
        pointToLayer: function (feature, latlng) {
          return circleMarker(latlng, lastmarkerOptions);
        },
        onEachFeature: this.h.leafletPopup,
      }
    );

    this.labels = graphlabels;
    this.data = graphdata;
    this.gpsdata = idata;
    this.gpslabels = labels;
    this.raw_graphlabels = raw_graphlabels;
    this.round_graphdigits = round_graphdigits;
    this.colors = newColors;
    // this.changeTrigger = !this.changeTrigger;
    console.log('graphlabels', labels);
    console.log('raw_graphlabels', this.raw_graphlabels);

    console.log('all data:', idata);
    console.log('graph data:', this.data);

    this.layers[2] = geoJSON(
      this.h.influx2geojsonPoints([this.gpsdata[0]], this.gpslabels),
      {
        pointToLayer: function (feature, latlng) {
          return circleMarker(latlng, {
            radius: 0,
            opacity: 0,
            fillOpacity: 0,
          });
        },
      }
    ); // point with no styling to remove hover-induced circle

    this.queryRunning = false;
  }
  exportGeojson() {
    this.h.exportGeojson(this.displayed_points);
  }
  handleHighlightCallback(dataObj: Object) {
    // console.log(dataObj);
    if (dataObj['points'] && dataObj['points'][0]) {
      const TObj = dataObj['points'][0];
      this.highlightDate = new Date(TObj['xval']);
      this.highlightValue = this.h.roundAccurately(
        TObj['yval'],
        this.round_graphdigits[1]
      );

      const highlightMarkerOptions = {
        radius: 10,
        // fillColor: '#0000ff80',
        color: '#0000ff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.3,
      };

      this.layers[2] = geoJSON(
        this.h.influx2geojsonPoints(
          [this.gpsdata[TObj['idx']]],
          this.gpslabels
        ),
        {
          pointToLayer: function (feature, latlng) {
            return circleMarker(latlng, highlightMarkerOptions);
          },
          onEachFeature: this.h.leafletPopup,
        }
      );
    }
  }
  ngOnDestroy() {
    this.localStorage.set(this.appName + 'sideBarShown', this.sideBarShown);
  }
}
