import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';

@Component({
  selector: 'app-pressure',
  templateUrl: './pressure.component.html',
  styleUrls: ['./pressure.component.scss'],
})
export class PressureComponent implements OnInit {
  extraDyGraphConfig = { pointSize: 3 };
  labelBlackListT = ['pressure', 'serial', 'id'];
  graphstyle = {
    position: 'absolute',
    top: '4em',
    bottom: '0rem',
    left: '0rem',
    right: '15rem',
  };

  public startTime = '24h';
  public userStartTime = this.startTime;
  public meanS = 54;
  public userMeanS = this.meanS;

  labels = [];
  data = [];

  appName = 'Air Pressure';

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
      'SELECT mean("air_hPa") FROM pressure WHERE time > now() - ' +
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

  launchQuery(clause: string) {
    if (!this.globalSettings.server.influxdb) {
      console.log('db not yet set, wait');
      setTimeout(() => {
        this.launchQuery(clause);
      }, 1000);
      return;
    }
    const q = this.utHTTP.buildInfluxQuery(clause);
    this.utHTTP.getHTTPData(q).subscribe(
      (data: Object) => this.handleData(data),
      (error) => this.globalSettings.displayHTTPerror(error)
    );
  }
  saveMean(param) {
    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
  }

  handleData(data: Object) {
    let ret = this.utHTTP.parseInfluxData(data, this.labelBlackListT);
    console.log('received', ret);
    if (ret['error']) {
      alert('Influx Error: ' + ret['error']);
      return;
    }
    this.labels = ret['labels'];
    this.data = ret['data'];
    // console.log(cloneDeep(this.dygLabels));
    this.startTime = this.userStartTime;
    // this.changeTrigger = !this.changeTrigger;
  }
}
