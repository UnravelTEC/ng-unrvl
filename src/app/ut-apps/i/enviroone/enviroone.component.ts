import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-enviroone',
  templateUrl: './enviroone.component.html',
  styleUrls: ['./enviroone.component.scss'],
})
export class EnvirooneComponent implements OnInit {
  physParamEnabled = {
    T: true,
    rH: true,
    P: true,
    PM: true,
    NO2: true,
  };
  sensorsEnabled = {
    BME280: true,
    EE08: true,
    'OPC-N3': true,
    SDS011: true,
    SPS30: true,
    NO2B43F: true,
  };
  physParamColors = {
    T: 'red',
    rH: 'blue',
    P: 'green',
    PM: 'brown',
    NO2: 'violet',
  };
  searchstrings = {
    T: 'temperature',
    rH: 'humidity',
    P: 'pressure',
    PM: 'particulate',
    NO2: 'gas',
  };
  colors = [];
  graphWidth = 1500;
  setGraphWidth(width) {
    this.graphWidth = width;
    console.log('new w', width);
  }

  extraDyGraphConfig = {
    connectSeparatedPoints: true,
    pointSize: 3,
    series: {
      'pressure sensor: BME280, pressure (hPa)': {
        axis: 'y2',
      },
    },
    y2label: 'Atmospheric Pressure (hPa)',
    axes: {
      y: {
        logscale: false,
      },
      y2: {
        independentTicks: true, // default opt here to have a filled object to access later
      },
    },
  };
  labelBlackListT = ['host', 'serial', 'mean_*'];
  graphstyle = {
    position: 'absolute',
    top: '0.5em',
    bottom: '0.5rem',
    left: '0.5rem',
    right: '15rem',
  };

  public startTime = '6h';
  public userStartTime = this.startTime;
  public meanS = 30;
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
  db = 'envirograz000';
  server = 'https://newton.unraveltec.com';

  labels = [];
  data = [];

  appName = 'Enviro Graph';

  changeTrigger = true;

  constructor(
    private globalSettings: GlobalSettingsService,
    private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService,
    public h: HelperFunctionsService,
    private router: ActivatedRoute
  ) {
    this.globalSettings.emitChange({ appName: this.appName });
  }

  ngOnInit() {
    this.globalSettings.emitChange({ fullscreen: true });
    const lsMean = this.localStorage.get(this.appName + 'userMeanS');
    if (lsMean) {
      this.userMeanS = lsMean;
    }
    const lsStartTime = this.localStorage.get(this.appName + 'userStartTime');
    if (lsStartTime) {
      this.userStartTime = lsStartTime;
    }
    const filter = this.router.snapshot.queryParamMap.get('filter');
    // const chosenfilter = this.filters[filter];
    if (filter && this.physParamEnabled.hasOwnProperty(filter)) {
      for (const key in this.physParamEnabled) {
        if (this.physParamEnabled.hasOwnProperty(key)) {
          this.physParamEnabled[key] = key == filter ? true : false;
        }
      }
    }
    if (this.physParamEnabled['PM']) {
      this.extraDyGraphConfig.axes.y.logscale = true;
    }
    console.log('filter', filter);

    this.reload();
  }
  isAnySensorEnabled(sarray: Array<string>) {
    for (const sensor of sarray) {
      if (this.sensorsEnabled[sensor]) return true;
    }
    return false;
  }
  enabledSensors(sarray: Array<string>) {
    const onSensors = [];
    sarray.forEach((sensor) => {
      if (this.sensorsEnabled[sensor]) onSensors.push(sensor);
    });
    return onSensors;
  }
  reload(fromTo = false) {
    this.meanS = this.userMeanS;
    this.currentres = this.meanS;
    this.startTime = this.userStartTime;
    const mS = String(this.meanS);

    const timeQuery = fromTo
      ? this.utHTTP.influxTimeString(this.fromTime, this.toTime)
      : this.utHTTP.influxTimeString(this.startTime);

    let queries = '';

    const Tsensors = ['BME280', 'EE08'];
    if (this.physParamEnabled['T'] && this.isAnySensorEnabled(Tsensors)) {
      queries += this.utHTTP.influxMeanQuery(
        'temperature',
        timeQuery,
        { sensor: this.enabledSensors(Tsensors) },
        this.meanS
      );
    }

    const rHsensors = ['BME280', 'EE08'];
    if (this.physParamEnabled['rH'] && this.isAnySensorEnabled(rHsensors)) {
      queries += this.utHTTP.influxMeanQuery(
        'humidity',
        timeQuery,
        { sensor: this.enabledSensors(rHsensors) },
        this.meanS,
        '/rel_percent/'
      );
    }

    if (this.physParamEnabled['P'] && this.sensorsEnabled['BME280']) {
      queries += this.utHTTP.influxMeanQuery(
        'pressure',
        timeQuery,
        { sensor: undefined }, // to use in group by
        this.meanS
      );
    }

    const PMsensors = ['OPC-N3', 'SDS011', 'SPS30'];
    if (this.physParamEnabled['PM'] && this.isAnySensorEnabled(PMsensors)) {
      queries += this.utHTTP.influxMeanQuery(
        'particulate_matter',
        timeQuery,
        { sensor: this.enabledSensors(PMsensors) },
        this.meanS,
        '/p(1|2.5|10)_ugpm3/'
      );
    }

    if (this.physParamEnabled['NO2'] && this.sensorsEnabled['NO2B43F']) {
      queries += this.utHTTP.influxMeanQuery(
        'gas',
        timeQuery,
        {},
        this.meanS,
        '/NO2_ugpm3/'
      );
    }

    // console.log('TQ:', queries);
    if (queries) this.launchQuery(queries);
  }

  calcMean(secondsRange) {
    const divider = Math.floor(secondsRange / this.graphWidth);
    return divider > 30 ? divider : 30;
  }
  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);

    this.userMeanS = this.calcMean(rangeSeconds);

    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
    this.localStorage.set(this.appName + 'userStartTime', this.userStartTime);
    this.reload();
  }

  launchQuery(clause: string) {
    if (!this.globalSettings.server.influxdb) {
      console.log('db not yet set, wait');
      setTimeout(() => {
        this.launchQuery(clause);
      }, 1000);
      return;
    }

    const q = this.utHTTP.buildInfluxQuery(clause, this.db, this.server);
    this.utHTTP
      // .getHTTPData(q)
      .getHTTPData(q, 'grazweb', '.RaVNaygexThM')
      .subscribe(
        (data: Object) => this.handleData(data),
        (error) => this.globalSettings.displayHTTPerror(error)
      );
  }
  setAvg(t) {
    this.userMeanS = t;
    this.saveMean(t);
  }
  saveMean(param) {
    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
  }

  handleData(data: Object) {
    console.log('received', data);
    let ret = this.utHTTP.parseInfluxData(data, this.labelBlackListT);
    console.log('parsed', ret);
    const labels = ret['labels'];
    const idata = ret['data'];

    let logscale = true;
    const colorCounters = {};
    const newColors = [];
    for (let c = 1; c < labels.length; c++) {
      const item = labels[c];

      for (const key in this.searchstrings) {
        if (this.searchstrings.hasOwnProperty(key)) {
          const str = this.searchstrings[key];
          if (item.match(str)) {
            console.log('found', str, 'in', item);
            const currentColorSet = this.physParamColors[key];
            const rightColorArray = this.h.colors[currentColorSet];
            if (colorCounters.hasOwnProperty(currentColorSet)) {
              const i = (colorCounters[currentColorSet] += 1);
              newColors.push(rightColorArray[i % rightColorArray.length]);
            } else {
              colorCounters[currentColorSet] = 0;
              newColors.push(rightColorArray[0]);
            }
            break;
          }
        }
      }

      if (logscale == true) {
        for (let r = 0; r < idata.length; r++) {
          const point = idata[r][c];
          if (point <= 0 && point !== NaN && point !== null) {
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
      if (item.match(/NO₂ \(µg\/m³\)/)) {
        for (let r = 0; r < idata.length; r++) {
          idata[r][c] = this.h.smoothNO2(idata[r][c]);
        }
      }
      if (item.match(/pressure/)) {
        this.extraDyGraphConfig.axes.y2['axisLabelWidth'] = 60;
      }
    }
    // console.log(cloneDeep(this.dygLabels));
    if (logscale) {
      console.log('scale: log');
      this.extraDyGraphConfig.axes.y.logscale = logscale;
    } else {
      console.log('scale: lin');
    }
    this.startTime = this.userStartTime;
    this.labels = labels;
    this.data = idata;
    this.colors = newColors;
    console.log(labels);
    console.log(idata);
    this.changeTrigger = !this.changeTrigger;
    this.changeTrigger = !this.changeTrigger;
  }
}
