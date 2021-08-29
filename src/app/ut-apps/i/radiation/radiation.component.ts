import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';

@Component({
  selector: 'app-radiation',
  templateUrl: './radiation.component.html',
  styleUrls: ['./radiation.component.scss']
})
export class RadiationComponent implements OnInit {
  extraDyGraphConfig = { pointSize: 3 };
  labelBlackListT = ['humidity', 'radiation', 'serial', 'id'];
  graphstyle = {
    position: 'absolute',
    top: '4em',
    bottom: '0rem',
    left: '0rem',
    right: '15rem'
  };

  multiplicateFactor = 1000000000;

  public startTime = '24h';
  public userStartTime = this.startTime;
  public meanS = 54;
  public userMeanS = this.meanS;

  labels = [];
  data = [];

  appName = 'Radiation';

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
      'SELECT 1000000000 * mean("total_Svph") FROM radiation WHERE time > now() - ' +
        this.startTime +
        ' GROUP BY sensor,host,time(' +
        String(this.meanS) +
        's)'
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
  saveMean(param) {
    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
  }

  launchQuery(clause: string) {
    if (!this.globalSettings.server.influxdb) {
      console.log('db not yet set, wait');
      setTimeout(() => {
        this.launchQuery(clause);
      }, 1000);
      return;
    }

    const q = this.utHTTP.buildInfluxQuery(clause, 'koffer')
    this.utHTTP
      // .getHTTPData(q)
      .getHTTPData(q, 'utweb', 'kJImNSmq1m84py7jhaGq')
      .subscribe((data: Object) => this.handleData(data));
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
