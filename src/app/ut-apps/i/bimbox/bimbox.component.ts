import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';
import { stringify } from 'querystring';

@Component({
  selector: 'app-bimbox',
  templateUrl: './bimbox.component.html',
  styleUrls: ['./bimbox.component.scss']
})
export class BimboxComponent implements OnInit {
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

  extraDyGraphConfig = { connectSeparatedPoints: true, pointSize: 3 };
  extraDyGraphConfigP = {
    connectSeparatedPoints: true,
    pointSize: 3,
    axes: {
      y: {
        axisLabelWidth: 60
      }
    }
  };
  extraDyGraphConfigPM = {
    connectSeparatedPoints: true,
    pointSize: 3,
    axes: {
      y: {
        logscale: true
      }
    }
  };

  isNaN(a) {
    return isNaN(a);
  }
  changeTrigger = true;
  public startTime = '1h';
  public userStartTime = this.startTime;
  public currentres = 0;
  public meanS = 10;
  public userMeanS = this.meanS;
  db = 'bimbox001';
  server = 'https://newton.unraveltec.com';

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
  graphWidth = 1000;
  setGraphWidth(width) {
    this.graphWidth = width;
    console.log('new w', width);
  }

  constructor(
    public globalSettings: GlobalSettingsService,
    private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService,
    public h: HelperFunctionsService
  ) {
    this.globalSettings.emitChange({ appName: 'BimBox 001' });
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
    'mean_*',
    'mean'
  ];

  ngOnInit() {
    this.globalSettings.emitChange({ fullscreen: true });
    this.reload();
  }
  reload() {
    this.meanS = this.userMeanS;
    this.currentres = this.meanS;
    this.startTime = this.userStartTime;
    const timeQuery = this.utHTTP.influxTimeString(this.startTime);
    this.launchQuery(
      this.utHTTP.influxMeanQuery(
        'humidity',
        timeQuery,
        { sensor: ['BME280'], id: ['i2c-7_0x76'] },
        this.meanS
      ),
      'T'
    );
    this.launchQuery(
      this.utHTTP.influxMeanQuery(
        'movement',
        timeQuery,
        { sensor: [] },
        this.meanS
      ),
      'H'
    );
    this.launchQuery(
      this.utHTTP.influxMeanQuery(
        'pressure',
        timeQuery,
        { sensor: ['BME280'], id: ['i2c-7_0x76'] },
        this.meanS,
        '/air_hPa/'
      ),
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
  calcMean(secondsRange) {
    const divider = Math.floor(secondsRange / this.graphWidth);
    return divider > 30 ? divider : 30;
  }

  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);
    this.userMeanS = this.calcMean(rangeSeconds);
    this.reload();
  }

  launchQuery(clause: string, id: string) {
    const q = this.utHTTP.buildInfluxQuery(clause, this.db, this.server);

    this.utHTTP
      .getHTTPData(q, 'bimweb', 'D,OEZ4UL+[hGgMQA(@<){W[kd')
      .subscribe((data: Object) => this.handleData(data, id));
  }

  handleData(data: Object, id: string) {
    let ret = this.utHTTP.parseInfluxData(data, this.labelBlackListT);
    console.log(id, 'received', ret);
    this.labels[id] = ret['labels'];
    this.data[id] = ret['data'];
    if (id == 'N') {
      const Ndata = this.data['N'];
      for (let r = 0; r < Ndata.length; r++) {
        Ndata[r][1] = this.h.smoothNO2(Ndata[r][1]);
      }
    }
    if (id == 'H') {
      const Ndata = this.data['H'];
      for (let r = 0; r < Ndata.length; r++) {
        Ndata[r][1] = Ndata[r][1] * 3,6; // mps to km/h
      }
    }
    // console.log(cloneDeep(this.dygLabels));
    this.startTimes[id] = this.userStartTime;
    this.changeTrigger = !this.changeTrigger;
  }
}
