import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';

@Component({
  selector: 'app-indoorclimate',
  templateUrl: './indoorclimate.component.html',
  styleUrls: ['./indoorclimate.component.scss']
})
export class IndoorclimateComponent implements OnInit {
  graphstyle = {
    position: 'absolute',
    top: '0',
    bottom: '0.5rem',
    left: '0.5rem',
    right: '1rem'
  };

  extraDyGraphConfig = { connectSeparatedPoints: true, pointSize: 3 };

  isNaN(a) {
    return isNaN(a);
  }
  changeTrigger = true;
  public startTime = '1h';
  public userStartTime = this.startTime;
  public meanS = 10;
  public userMeanS = this.meanS;

  labels = {
    T: {},
    H: {},
    CO2: {},
    V: {}
  };
  data = {
    T: [],
    H: [],
    CO2: [],
    V: []
  };
  startTimes = {
    T: this.startTime,
    H: this.startTime,
    CO2: this.startTime,
    V: this.startTime
  };

  constructor(
    public globalSettings: GlobalSettingsService,
    private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService,
    private h: HelperFunctionsService
  ) {
    this.globalSettings.emitChange({ appName: 'Indoor Room Climate' });
  }

  labelBlackListT = [
    'interval',
    'temperature',
    'pressure',
    'humidity',
    'particulate_matter',
    'serial',
    'id',
    'host',
    'mean',
    'mean_*'
  ];

  ngOnInit() {
    this.reload();
  }
  reload() {
    this.meanS = this.userMeanS;
    this.startTime = this.userStartTime;
    this.launchQuery(
      'SELECT mean(air_degC) FROM temperature WHERE time > now() - ' +
        this.startTime +
        ' GROUP BY sensor,time(' +
        String(this.meanS) +
        's)',
      'T'
    );
    this.launchQuery(
      // "SELECT mean(/H2O|humidity|dewPoint/) FROM humidity WHERE sensor='SCD30|DS18B20' AND time > now() - " +
      'SELECT mean(/H2O|humidity|dewPoint/) FROM humidity WHERE time > now() - ' +
        this.startTime +
        ' GROUP BY sensor,time(' +
        String(this.meanS) +
        's);',
      'H'
    );
    this.launchQuery(
      'SELECT mean(CO2_ppm) FROM gas WHERE time > now() - ' +
        this.startTime +
        ' GROUP BY sensor,time(' +
        String(this.meanS) +
        's)',
      'CO2'
    );
    this.launchQuery(
      'SELECT mean(VOC_ppm) FROM gas WHERE time > now() - ' +
        this.startTime +
        ' GROUP BY sensor,time(' +
        String(this.meanS) +
        's)',
      'V'
    );
  }

  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);
    const widthPx = 600;
    const divider = rangeSeconds / widthPx;
    if (divider > 1) {
      this.userMeanS = Math.floor(divider);
    }
  }

  launchQuery(clause: string, id: string) {
    const q = this.utHTTP.buildInfluxQuery(clause, undefined, undefined, 's');
    this.utHTTP
      .getHTTPData(q)
      .subscribe((data: Object) => this.handleData(data, id));
  }

  handleData(data: Object, id: string) {
    let ret = this.utHTTP.parseInfluxData(data, this.labelBlackListT, 's');
    console.log(id, 'received', ret);
    this.labels[id] = ret['labels'];
    this.data[id] = ret['data'];
    // console.log(cloneDeep(this.dygLabels));
    this.startTimes[id] = this.userStartTime;
    this.changeTrigger = !this.changeTrigger;
  }
}
