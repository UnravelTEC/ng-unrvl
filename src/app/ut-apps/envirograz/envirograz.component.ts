import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { LocalStorageService } from '../../core/local-storage.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

@Component({
  selector: 'app-envirograz',
  templateUrl: './envirograz.component.html',
  styleUrls: ['./envirograz.component.scss']
})
export class EnvirograzComponent implements OnInit {
  graphstyle = {
    position: 'absolute',
    top: '0',
    bottom: '0.5rem',
    left: '0.5rem',
    right: '1rem'
  };
  graphstylePM = {
    position: 'absolute',
    top: '0',
    bottom: '0.5rem',
    left: '0.5rem',
    right: '1rem'
  };
  multiplicateFactors = [1000];

  extraDyGraphConfig = { connectSeparatedPoints: true, pointSize: 3 };

  isNaN(a) {
    return isNaN(a);
  }
  changeTrigger = true;
  public startTime = '1h';
  db = 'envirograz000';

  labels = {
    T: {},
    H: {},
    P: {},
    PM: {},
    N: {}
  };
  data = {
    T: [],
    H: [],
    P: [],
    PM: [],
    N: []
  };

  public row1 = [new Date(new Date().valueOf() - 300100), 1]; //, null, null];
  public row2 = [new Date(new Date().valueOf() - 200000), 2]; // null, 1.2, 0.8];

  constructor(
    private globalSettings: GlobalSettingsService,
    private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService
  ) {
    this.globalSettings.emitChange({ appName: 'Enviro Graz' });
    for (const key in this.labels) {
      if (this.labels.hasOwnProperty(key)) {
        this.labels[key] = ['Date', 'sensor1-val1'];

        this.data[key] = [this.row1, this.row2]
      }
    }
  }

  labelBlackListT = [
    'interval',
    'temperature',
    'pressure',
    'humidity',
    'particulate_matter',
    'serial',
    'id',
    'host'
  ];

  ngOnInit() {
    this.launchQuery(
      'SELECT mean(*) FROM temperature WHERE time > now() - ' +
        this.startTime +
        ' GROUP BY sensor,time(10s)',
      'T'
    );
    this.launchQuery(
      'SELECT mean(/rel_percent/) FROM humidity WHERE time > now() - ' +
        this.startTime +
        ' GROUP BY sensor,time(10s)',
      'H'
    );
    this.launchQuery(
      'SELECT mean(*) FROM pressure WHERE time > now() - ' +
        this.startTime +
        ' GROUP BY sensor,time(10s)',
      'P'
    );
    this.launchQuery(
      'SELECT mean(/p(1|2.5|10)_ugpm3/) FROM particulate_matter WHERE time > now() - ' +
        this.startTime +
        ' GROUP BY sensor,time(10s)',
      'PM'
    );
    this.launchQuery(
      'SELECT mean(NO2_ugpm3) FROM gas WHERE time > now() - ' +
        this.startTime +
        ' GROUP BY sensor,time(10s)',
      'N'
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

  launchQuery(clause: string, id: string) {
    const q = this.buildQuery(clause);

    this.utHTTP
      .getHTTPData(q)
      .subscribe((data: Object) => this.handleData(data, id));
  }

  handleData(data: Object, id: string) {
    let ret = this.utHTTP.parseInfluxData(data, this.labelBlackListT);
    console.log(id, 'received', ret);
    this.labels[id] = ret['labels'];
    this.data[id] = ret['data'];
    // console.log(cloneDeep(this.dygLabels));
    this.changeTrigger = !this.changeTrigger;
  }
}
