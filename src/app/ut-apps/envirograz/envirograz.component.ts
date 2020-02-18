import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { LocalStorageService } from '../../core/local-storage.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../core/helper-functions.service';
import { stringify } from 'querystring';

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
    left: '15rem',
    right: '0.5rem'
  };
  multiplicateFactors = [1000];

  backGroundLevelsPM = [
    // the color acts for "everything below $value"
    [0.01, 'white'], // first one not used
    [25, 'rgba(0, 128, 0, 0.678)'], // green
    [50, 'rgba(0, 128, 0, 0.35)'], // light green
    [100, 'rgba(255, 255, 0, 0.35)'], // yellow
    [250, 'rgba(255, 166, 0, 0.35)'], // orange
    [500, 'rgba(255, 0, 0, 0.35)'] // red
  ];
  backGroundLevelsN = [
    // the color acts for "everything below $value"
    [0.01, 'white'], // first one not used
    [40, 'rgba(0, 128, 0, 0.678)'], // green Jahresgrenzwert
    [80, 'rgba(0, 128, 0, 0.35)'], // light green Vorsorgegrenzwert 60-Minuten-Mittelwert
    [200, 'rgba(255, 255, 0, 0.35)'], // yellow 1h-Mittel-Grenzwert Außen
    [250, 'rgba(255, 166, 0, 0.35)'], // orange 1h-Mittel Gefahrengrenzwert f Innenräume
    [400, 'rgba(255, 0, 0, 0.35)'] // red Alarmschwelle
  ];

  extraDyGraphConfig = { connectSeparatedPoints: true, pointSize: 3 };
  extraDyGraphConfigPM = {
    connectSeparatedPoints: true,
    pointSize: 3,
    logscale: true
  };

  isNaN(a) {
    return isNaN(a);
  }
  changeTrigger = true;
  public startTime = '1h';
  public userStartTime = this.startTime;
  public meanS = 10;
  public userMeanS = this.meanS;
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
  startTimes = {
    T: this.startTime,
    H: this.startTime,
    P: this.startTime,
    PM: this.startTime,
    N: this.startTime
  };

  public row1 = [new Date(new Date().valueOf() - 300100), 1]; //, null, null];
  public row2 = [new Date(new Date().valueOf() - 200000), 2]; // null, 1.2, 0.8];

  constructor(
    private globalSettings: GlobalSettingsService,
    private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService,
    private h: HelperFunctionsService
  ) {
    this.globalSettings.emitChange({ appName: 'Enviro Graz 000' });
    for (const key in this.labels) {
      if (this.labels.hasOwnProperty(key)) {
        this.labels[key] = ['Date', 'sensor1-val1'];

        this.data[key] = [this.row1, this.row2];
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
    this.reload();
  }
  reload() {
    this.meanS = this.userMeanS;
    this.startTime = this.userStartTime;
    this.launchQuery(
      'SELECT mean(*) FROM temperature WHERE time > now() - ' +
        this.startTime +
        ' GROUP BY sensor,time(' +
        String(this.meanS) +
        's)',
      'T'
    );
    this.launchQuery(
      'SELECT mean(/rel_percent/) FROM humidity WHERE time > now() - ' +
        this.startTime +
        ' GROUP BY sensor,time(' +
        String(this.meanS) +
        's)',
      'H'
    );
    this.launchQuery(
      'SELECT mean(*) FROM pressure WHERE time > now() - ' +
        this.startTime +
        ' GROUP BY sensor,time(' +
        String(this.meanS) +
        's)',
      'P'
    );
    this.launchQuery(
      'SELECT mean(/p(1|2.5|10)_ugpm3/) FROM particulate_matter WHERE time > now() - ' +
        this.startTime +
        ' GROUP BY sensor,time(' +
        String(this.meanS) +
        's)',
      'PM'
    );
    this.launchQuery(
      'SELECT mean(NO2_ugpm3) FROM gas WHERE time > now() - ' +
        this.startTime +
        ' GROUP BY sensor,time(' +
        String(this.meanS) +
        's)',
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
  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);
    const widthPx = 600;
    const divider = rangeSeconds / widthPx;
    if (divider > 1) {
      this.userMeanS = Math.floor(divider);
    }
  }

  launchQuery(clause: string, id: string) {
    const q = this.buildQuery(clause);
    console.log('new query:', q);

    this.utHTTP
      // .getHTTPData(q)
      .getHTTPData(q, 'grazweb', '.RaVNaygexThM')
      .subscribe((data: Object) => this.handleData(data, id));
  }

  handleData(data: Object, id: string) {
    let ret = this.utHTTP.parseInfluxData(data, this.labelBlackListT);
    console.log(id, 'received', ret);
    this.labels[id] = ret['labels'];
    this.data[id] = ret['data'];
    // console.log(cloneDeep(this.dygLabels));
    this.startTimes[id] = this.userStartTime;
    this.changeTrigger = !this.changeTrigger;
  }
}
