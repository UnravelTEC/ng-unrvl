import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';

@Component({
  selector: 'app-enviroone',
  templateUrl: './enviroone.component.html',
  styleUrls: ['./enviroone.component.scss']
})
export class EnvirooneComponent implements OnInit {
  sensorsEnabled = {
    BME280: true,
    EE08: true,
    OPCN3: true,
    SDS011: true,
    SPS30: true,
    NO2B43F: true
  };

  extraDyGraphConfig = {
    connectSeparatedPoints: true,
    pointSize: 3,
    logscale: true
  };
  labelBlackListT = ['host', 'serial'];
  graphstyle = {
    position: 'absolute',
    top: '4em',
    bottom: '0rem',
    left: '0rem',
    right: '15rem'
  };

  public startTime = '6h';
  public userStartTime = this.startTime;
  public meanS = 13;
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
    private h: HelperFunctionsService
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
    this.reload();
  }
  reload() {
    this.meanS = this.userMeanS;
    this.startTime = this.userStartTime;
    const ts = this.startTime;
    const mS = String(this.meanS);

    let rHquery = '';
    if (this.sensorsEnabled['BME280'] || this.sensorsEnabled['EE08']) {
      let sensorw = '',
        s;
      for (s of ['BME280', 'EE08']) {
        if (this.sensorsEnabled[s]) {
          sensorw += (sensorw ? ' OR ' : '') + "sensor='" + s + "'";
        }
      }

      rHquery =
        'SELECT mean(*) FROM temperature WHERE (' +
        sensorw +
        ') AND time > now() - ' +
        ts +
        ' GROUP BY sensor,host,time(' +
        mS +
        's);' +
        'SELECT mean(/rel_percent/) FROM humidity WHERE ' +
        (sensorw ? '(' + sensorw + ') AND ' : '') +
        ' time > now() - ' +
        ts +
        ' GROUP BY sensor,host,time(' +
        mS +
        's);';
    }

    let pquery = '';
    if (this.sensorsEnabled['BME280']) {
      pquery =
        'SELECT mean(*) FROM pressure WHERE time > now() - ' +
        ts +
        ' GROUP BY sensor,host,time(' +
        mS +
        's);';
    }

    let pmquery = '';
    if (
      this.sensorsEnabled['OPCN3'] ||
      this.sensorsEnabled['SDS011'] ||
      this.sensorsEnabled['SPS30']
    ) {
      pmquery =
        'SELECT mean(/p(1|2.5|10)_ugpm3/) FROM particulate_matter WHERE ';

      let sensorw = '';
      if (
        !(
          this.sensorsEnabled['OPCN3'] &&
          this.sensorsEnabled['SDS011'] &&
          this.sensorsEnabled['SPS30']
        )
      ) {
        let s;
        for (s of ['OPCN3', 'SDS011', 'SPS30']) {
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
    if (this.sensorsEnabled['NO2B43F']) {
      no2query =
        'SELECT mean(NO2_ugpm3) FROM gas WHERE time > now() - ' +
        ts +
        ' GROUP BY sensor,host,time(' +
        mS +
        's);';
    }
    this.launchQuery(rHquery + pquery + pmquery + no2query);
  }

  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);
    const widthPx = 1600;
    const divider = rangeSeconds / widthPx;
    if (divider > 1) {
      this.userMeanS = Math.floor(divider);
    }
    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
    this.localStorage.set(this.appName + 'userStartTime', this.userStartTime);
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
    this.labels = ret['labels'];
    this.data = ret['data'];
    // console.log(cloneDeep(this.dygLabels));
    this.startTime = this.userStartTime;
    // this.changeTrigger = !this.changeTrigger;
  }
}
