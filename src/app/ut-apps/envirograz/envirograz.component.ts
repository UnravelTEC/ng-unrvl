import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { LocalStorageService } from '../../core/local-storage.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../core/helper-functions.service';

@Component({
  selector: 'app-envirograz',
  templateUrl: './envirograz.component.html',
  styleUrls: ['./envirograz.component.scss'],
})
export class EnvirograzComponent implements OnInit {
  graphstyle = {
    position: 'absolute',
    top: '0',
    bottom: '0.5rem',
    left: '0.5rem',
    right: '1rem',
  };
  graphstylePM = {
    position: 'absolute',
    top: '0',
    bottom: '0.5rem',
    left: '15rem',
    right: '0.5rem',
  };
  multiplicateFactors = [1000];

  extraDyGraphConfig = { connectSeparatedPoints: true, pointSize: 3 };
  extraDyGraphConfigP = {
    connectSeparatedPoints: true,
    pointSize: 3,
    axes: {
      y: {
        axisLabelWidth: 60,
      },
    },
  };
  extraDyGraphConfigPM = {
    connectSeparatedPoints: true,
    pointSize: 3,
    axes: {
      y: {
        logscale: true,
      },
    },
  };

  isNaN(a) {
    return isNaN(a);
  }
  changeTrigger = 0;
  public startTime = '1h';
  public userStartTime = this.startTime;
  public currentres = 0;
  public meanS = 10;
  public userMeanS = this.meanS;
  db = 'envirograz000';
  server = 'https://newton.unraveltec.com';

  labels = {
    T: {},
    H: {},
    P: {},
    PM: {},
    N: {},
  };
  data = {
    T: [],
    H: [],
    P: [],
    PM: [],
    N: [],
  };
  startTimes = {
    T: this.startTime,
    H: this.startTime,
    P: this.startTime,
    PM: this.startTime,
    N: this.startTime,
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
    this.globalSettings.emitChange({ appName: 'Enviro Graz 000' });
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
    'mean',
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
        'temperature',
        timeQuery,
        { sensor: ['EE08', 'BME280'] },
        this.meanS
      ),
      'T'
    );
    this.launchQuery(
      this.utHTTP.influxMeanQuery(
        'humidity',
        timeQuery,
        { sensor: [] },
        this.meanS,
        '/rel_percent/'
      ),
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

  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);
    this.userMeanS = this.h.calcMean(rangeSeconds, this.graphWidth);
    this.reload();
  }

  launchQuery(clause: string, id: string) {
    const q = this.utHTTP.buildInfluxQuery(clause, this.db, this.server);

    this.utHTTP.getHTTPData(q, 'grazweb', '.RaVNaygexThM').subscribe(
      (data: Object) => this.handleData(data, id),
      (error) => this.globalSettings.displayHTTPerror(error)
    );
  }

  handleData(data: Object, id: string) {
    let ret = this.utHTTP.parseInfluxData(data, this.labelBlackListT);
    if (ret['error']) {
      alert('Influx Error: ' + ret['error']);
      return;
    }
    console.log(id, 'received', ret);
    this.labels[id] = ret['labels'];
    this.data[id] = ret['data'];
    if (id == 'N') {
      const Ndata = this.data['N'];
      for (let r = 0; r < Ndata.length; r++) {
        Ndata[r][1] = this.h.smoothNO2(Ndata[r][1]);
      }
    }
    // console.log(cloneDeep(this.dygLabels));
    this.startTimes[id] = this.userStartTime;
    this.changeTrigger += 1;
  }
}
