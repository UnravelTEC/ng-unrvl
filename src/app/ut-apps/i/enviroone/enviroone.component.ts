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
  extraDyGraphConfig = { connectSeparatedPoints: true, pointSize: 3 , logscale: true};
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

  public row1 = [new Date(new Date().valueOf() - 300100), 1]; //, null, null];
  public row2 = [new Date(new Date().valueOf() - 200000), 2]; // null, 1.2, 0.8];

  labels = ['Date', 'sensor1-val1'];
  data = [this.row1, this.row2];

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
    this.launchQuery(
      "SELECT mean(*) FROM temperature WHERE (sensor='EE08' OR sensor='BME280') AND time > now() - " +
        ts +
        ' GROUP BY sensor,host,time(' +
        mS +
        's);' +
        'SELECT mean(/rel_percent/) FROM humidity WHERE time > now() - ' +
        ts +
        ' GROUP BY sensor,host,time(' +
        mS +
        's);' +
        'SELECT mean(*) FROM pressure WHERE time > now() - ' +
        ts +
        ' GROUP BY sensor,host,time(' +
        mS +
        's);' +
        'SELECT mean(/p(1|2.5|10)_ugpm3/) FROM particulate_matter WHERE time > now() - ' +
        ts +
        ' GROUP BY sensor,host,time(' +
        mS +
        's);' +
        'SELECT mean(NO2_ugpm3) FROM gas WHERE time > now() - ' +
        ts +
        ' GROUP BY sensor,host,time(' +
        mS +
        's);'
    );
  }
  buildQuery(clause: string) {
    return (
      'https://' +
      this.globalSettings.server.serverName +
      '/influxdb/query?db=' +
      this.db +
      '&epoch=ms&q=' +
      clause
    ).replace(/;/g,'%3B');
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
    const q = this.buildQuery(clause);
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
