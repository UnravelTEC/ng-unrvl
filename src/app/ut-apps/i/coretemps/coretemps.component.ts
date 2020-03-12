import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';

@Component({
  selector: 'app-coretemps',
  templateUrl: './coretemps.component.html',
  styleUrls: ['./coretemps.component.scss']
})
export class CoretempsComponent implements OnInit {
  extraDyGraphConfig = { pointSize: 3 };
  labelBlackListT = ['temperature', 'serial'];
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
  db = 'koffer';

  public row1 = [new Date(new Date().valueOf() - 300100), 1]; //, null, null];
  public row2 = [new Date(new Date().valueOf() - 200000), 2]; // null, 1.2, 0.8];

  labels = ['Date', 'sensor1-val1'];
  data = [this.row1, this.row2];

  appName = 'Core Temperatures';

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
    this.launchQuery(
      'SELECT mean("cpu_degC") FROM temperature WHERE time > now() - ' +
        this.startTime +
        ' GROUP BY sensor,host,time(' +
        String(this.meanS) +
        's)'
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
    );
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
      .getHTTPData(q, 'utweb', 'kJImNSmq1m84py7jhaGq')
      .subscribe((data: Object) => this.handleData(data));
  }
  saveMean(param) {
    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
  }

  handleData(data: Object) {
    let ret = this.utHTTP.parseInfluxData(data, this.labelBlackListT);
    console.log('received', ret);
    this.labels = ret['labels'];
    this.data = ret['data'];
    // console.log(cloneDeep(this.dygLabels));
    this.startTime = this.userStartTime;
    // this.changeTrigger = !this.changeTrigger;
  }
}
