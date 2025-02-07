import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GlobalSettingsService } from 'app/core/global-settings.service';
import { HelperFunctionsService } from 'app/core/helper-functions.service';
import { LocalStorageService } from 'app/core/local-storage.service';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';

/* FIXME:
 * implement sync of two graphs
 * reload does not work with interval
 */

@Component({
  selector: 'app-scd30',
  templateUrl: './scd30.component.html',
  styleUrls: ['./scd30.component.scss'],
})
export class Scd30Component implements OnInit {
  graphWidth = 1500;
  setGraphWidth(width) {
    this.graphWidth = width;
    console.log('new w', width);
  }

  extraDyGraphConfig = {
    connectSeparatedPoints: true,
    pointSize: 3,
    logscale: false,
  };
  labelBlackListT = ['host', 'serial', 'mean_*', 'id', 'sensor', 'mean'];
  graphstyleTop = {
    position: 'absolute',
    top: '0.5em',
    bottom: '50%',
    left: '0.5rem',
    right: '15rem',
  };
  graphstyleBottom = {
    position: 'absolute',
    top: '51%',
    bottom: '0.5rem',
    left: '0.5rem',
    right: '15rem',
  };

  public startTime = '1h';
  public userStartTime = this.startTime;

  colors = {
    H: [],
    CO2: ['#842BFF'],
  };
  labels = {
    H: [],
    CO2: [],
  };
  raw_labels = {
    H: {},
    CO2: {},
  };
  data = {
    H: [],
    CO2: [],
  };
  startTimes = {
    H: this.startTime,
    CO2: this.startTime,
  };

  public meanS = 2;
  public currentres = 0;
  public userMeanS = this.meanS;
  public fromTime: Date;
  public toTime: Date;
  public currentRange: string;

  appName = 'SCD30';

  changeTrigger = 0;

  measurement = 'humidity (g/m³),temperature (°C)';
  sensor: String = 'SCD30';
  interval: string;
  // host = '';
  // referrer = 'Allsens';
  public from: number; // unix time from urlparam
  public to: number; // unix time from urlparam

  public queryRunning: number = 0;

  constructor(
    public globalSettings: GlobalSettingsService,
    private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService,
    private h: HelperFunctionsService,
    private router: ActivatedRoute
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

    [
      // 'host',
      // 'measurement',
      // 'sensor',
      // 'referrer',
      'from',
      'to',
      'interval',
    ].forEach((element) => {
      const thing = this.router.snapshot.queryParamMap.get(element);
      if (thing) {
        //   if (thing.search(',') > -1) {
        //     this[element] = thing.split(',');
        //   }
        this[element] = thing;
      }
    });

    if (this.from && this.to) {
      this.from = Number(this.from);
      this.to = Number(this.to);
      this.h.updateFromToTimes([this.from, this.to], this, this.interval);
      this.reload(true);
    } else {
      this.reload();
    }
  }

  reload(fromTo = false) {
    this.meanS = this.userMeanS;
    this.currentres = this.meanS;
    this.startTime = this.userStartTime;

    const timerange = fromTo
      ? (this.toTime.valueOf() - this.fromTime.valueOf()) / 1000
      : this.h.parseToSeconds(this.startTime);
    const nr_points = timerange / this.meanS;
    if (nr_points > 10000 && !this.h.bigQconfirm(nr_points)) {
      if (!this.labels['CO2'].length) {
        // at start to show "no data"
        this.labels['CO2'] = [''];
        this.labels['H'] = [''];
      }
      return;
    }

    const timeQuery = fromTo
      ? this.utHTTP.influxTimeString(this.fromTime, this.toTime)
      : this.utHTTP.influxTimeString(this.startTime);

    let params = { sensor: [] };
    if (this.sensor) {
      if (Array.isArray(this.sensor)) {
        params['sensor'] = this.sensor;
      } else {
        params['sensor'] = [this.sensor];
      }
    }
    // if (this.host) {
    //   params['host'] = this.host;
    // }

    const queryCO2 = this.utHTTP.influxMeanQuery(
      'gas',
      timeQuery,
      params,
      this.meanS,
      '/CO2_ppm/'
    );
    const queryH = this.utHTTP.influxMeanQuery(
      'gas',
      timeQuery,
      params,
      this.meanS,
      '/H2O_gpm3|sensor_degC/'
    );

    this.launchQuery(queryCO2, 'CO2');
    this.launchQuery(queryH, 'H');
  }


  changeMean(param) {
    const rangeSeconds = this.h.parseToSeconds(param);

    this.userMeanS = this.h.calcMean(rangeSeconds, this.graphWidth);

    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
    this.localStorage.set(this.appName + 'userStartTime', this.userStartTime);
    this.reload();
  }

  launchQuery(clause: string, id: string) {
    if (!this.globalSettings.influxReady()) {
      setTimeout(() => {
        this.launchQuery(clause, id);
      }, 1000);
      return;
    }
    this.queryRunning++;
    const q = this.utHTTP.buildInfluxQuery(clause, undefined, undefined, 's');
    this.utHTTP.getHTTPData(q).subscribe(
      (data: Object) => this.handleData(data, id),
      (error) => this.globalSettings.displayHTTPerror(error)
    );
  }
  saveMean(param) {
    this.localStorage.set(this.appName + 'userMeanS', this.userMeanS);
  }

  handleData(data: Object, id: string) {
    let ret = this.utHTTP.parseInfluxData(data, this.labelBlackListT, 's');
    console.log(id, 'received', ret);
    if (ret['error']) {
      alert('Influx Error: ' + ret['error']);
      this.queryRunning--;
      return;
    }
    this.labels[id] = ret['labels'];
    this.raw_labels[id] = ret['raw_labels'];
    this.data[id] = ret['data'];
    if (id == 'H') {
      this.colors['H'] = this.h.getColorsforLabels(ret['labels']);
    }
    // console.log(cloneDeep(this.dygLabels));
    this.startTimes[id] = this.userStartTime;
    this.changeTrigger += 1;
    this.queryRunning--;
  }
}
