import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-enviroone',
  templateUrl: './enviroone.component.html',
  styleUrls: ['./enviroone.component.scss']
})
export class EnvirooneComponent implements OnInit {
  physParamEnabled = {
    T: true,
    rH: true,
    P: true,
    PM: true,
    NO2: true
  };
  sensorsEnabled = {
    BME280: true,
    EE08: true,
    'OPC-N3': true,
    SDS011: true,
    SPS30: true,
    NO2B43F: true
  };
  physParamColors = {
    T: 'red',
    rH: 'blue',
    P: 'green',
    PM: 'brown',
    NO2: 'violet'
  };
  searchstrings = {
    T: 'temperature',
    rH: 'humidity',
    P: 'pressure',
    PM: 'particulate',
    NO2: 'gas'
  };
  colors = [];

  extraDyGraphConfig = {
    connectSeparatedPoints: true,
    pointSize: 3,
    logscale: false,
    series: {
      'pressure sensor: BME280, pressure (hPa)': {
        axis: 'y2'
      }
    },
    y2label: 'Atmospheric Pressure (hPa)',
    axes: {
      y2: {
        independentTicks: true,
        drawGrid: false
      }
    }
  };
  labelBlackListT = ['host', 'serial', 'mean_*'];
  graphstyle = {
    position: 'absolute',
    top: '4em',
    bottom: '0rem',
    left: '0.5rem',
    right: '15rem'
  };

  public startTime = '6h';
  public userStartTime = this.startTime;
  public meanS = 30;
  public userMeanS = this.meanS;
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
    private h: HelperFunctionsService,
    private router: ActivatedRoute
  ) {
    this.globalSettings.emitChange({ appName: this.appName });
  }

  ngOnInit() {
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
      this.extraDyGraphConfig.logscale = true;
    }
    console.log('filter', filter);

    this.reload();
  }
  reload() {
    this.meanS = this.userMeanS;
    this.startTime = this.userStartTime;
    const ts = this.startTime;
    const mS = String(this.meanS);

    let Tquery = '';
    if (
      this.physParamEnabled['T'] &&
      (this.sensorsEnabled['BME280'] || this.sensorsEnabled['EE08'])
    ) {
      let sensorw = '',
        s;
      for (s of ['BME280', 'EE08']) {
        if (this.sensorsEnabled[s]) {
          sensorw += (sensorw ? ' OR ' : '') + "sensor='" + s + "'";
        }
      }
      Tquery =
        'SELECT mean(*) FROM temperature WHERE (' +
        sensorw +
        ') AND time > now() - ' +
        ts +
        ' GROUP BY sensor,host,time(' +
        mS +
        's);';
    }

    let rHquery = '';
    if (
      this.physParamEnabled['rH'] &&
      (this.sensorsEnabled['BME280'] || this.sensorsEnabled['EE08'])
    ) {
      let sensorw = '',
        s;
      for (s of ['BME280', 'EE08']) {
        if (this.sensorsEnabled[s]) {
          sensorw += (sensorw ? ' OR ' : '') + "sensor='" + s + "'";
        }
      }
      rHquery =
        'SELECT mean(/rel_percent/) FROM humidity WHERE ' +
        (sensorw ? '(' + sensorw + ') AND ' : '') +
        ' time > now() - ' +
        ts +
        ' GROUP BY sensor,host,time(' +
        mS +
        's);';
    }

    let pquery = '';
    if (this.physParamEnabled['P'] && this.sensorsEnabled['BME280']) {
      pquery =
        'SELECT mean(*) FROM pressure WHERE time > now() - ' +
        ts +
        ' GROUP BY sensor,host,time(' +
        mS +
        's);';
    }

    let pmquery = '';
    if (
      this.physParamEnabled['PM'] &&
      (this.sensorsEnabled['OPC-N3'] ||
        this.sensorsEnabled['SDS011'] ||
        this.sensorsEnabled['SPS30'])
    ) {
      pmquery =
        'SELECT mean(/p(1|2.5|10)_ugpm3/) FROM particulate_matter WHERE ';

      let sensorw = '';
      if (
        !(
          this.sensorsEnabled['OPC-N3'] &&
          this.sensorsEnabled['SDS011'] &&
          this.sensorsEnabled['SPS30']
        )
      ) {
        let s;
        for (s of ['OPC-N3', 'SDS011', 'SPS30']) {
          if (this.sensorsEnabled[s]) {
            sensorw += (sensorw ? ' OR ' : '') + "sensor='" + s + "'";
          }
        }
      }

      pmquery +=
        (sensorw ? '(' + sensorw + ') AND ' : '') +
        'time > now() - ' +
        ts +
        ' GROUP BY sensor,host,time(' +
        mS +
        's);';
    }

    let no2query = '';
    if (this.physParamEnabled['NO2'] && this.sensorsEnabled['NO2B43F']) {
      no2query =
        // 'SELECT mean(/NO2_/) FROM gas WHERE time > now() - ' +
        'SELECT mean(/NO2_ugpm3/) FROM gas WHERE time > now() - ' +
        ts +
        ' GROUP BY sensor,host,time(' +
        mS +
        's);';
    }
    const queries = Tquery + rHquery + pquery + pmquery + no2query;
    if (queries) this.launchQuery(queries);
  }

  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);
    const widthPx = 1600;
    const divider = rangeSeconds / widthPx;
    if (divider > 1) {
      const rounded = Math.floor(divider);
      this.userMeanS = rounded > 30 ? rounded : 30;
    }
    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
    this.localStorage.set(this.appName + 'userStartTime', this.userStartTime);
    this.reload();
  }

  launchQuery(clause: string) {
    const q = this.utHTTP.buildInfluxQuery(clause, this.db, this.server);
    console.log('new query:', q);

    this.utHTTP
      // .getHTTPData(q)
      .getHTTPData(q, 'grazweb', '.RaVNaygexThM')
      .subscribe((data: Object) => this.handleData(data));
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
              this.colors.push(rightColorArray[i % rightColorArray.length]);
            } else {
              colorCounters[currentColorSet] = 0;
              this.colors.push(rightColorArray[0]);
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
    }
    // console.log(cloneDeep(this.dygLabels));
    if (logscale) {
      console.log('scale: log');
      this.extraDyGraphConfig.logscale = logscale;
    } else {
      console.log('scale: lin');
    }
    this.startTime = this.userStartTime;
    this.labels = labels;
    this.data = idata;
    console.log(labels);
    console.log(idata);
    this.changeTrigger = !this.changeTrigger;
    this.changeTrigger = !this.changeTrigger;
  }
}
