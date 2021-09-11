import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';
import { geoJSON, circleMarker } from 'leaflet';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-bimbox',
  templateUrl: './bimbox.component.html',
  styleUrls: ['./bimbox.component.scss'],
})
export class BimboxComponent implements OnInit {
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
    N: {},
    G: {},
  };
  data = {
    T: [],
    H: [],
    P: [],
    PM: [],
    N: [],
    G: [],
  };
  public gpslayers = [];

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
    public h: HelperFunctionsService,
    private router: ActivatedRoute
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
    'mean',
  ];

  ngOnInit() {
    // this.globalSettings.emitChange({ fullscreen: true });
    const starttime = this.router.snapshot.queryParamMap.get('t');
    if (starttime && this.h.parseToSeconds(starttime) > 0) {
      this.userStartTime = starttime;
      this.changeMean(starttime);
    }
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
    this.launchQuery(
      'SELECT FIRST(/lat|lon/) FROM location WHERE time > now() - ' +
        this.startTime +
        ' GROUP BY sensor,time(' +
        String(this.meanS) +
        's)',
      'G'
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
    console.log('launchQuery', this.globalSettings.server.baseurl);

    if (this.globalSettings.server.baseurl.startsWith('https')) {
      const q = this.utHTTP.buildInfluxQuery(clause, this.db, this.server);

      this.utHTTP
        .getHTTPData(q, 'bimweb', 'D,OEZ4UL+[hGgMQA(@<){W[kd')
        .subscribe(
          (data: Object) => this.handleData(data, id),
          (error) => this.globalSettings.displayHTTPerror(error)
        );
    } else {
      const q = this.utHTTP.buildInfluxQuery(clause);

      this.utHTTP.getHTTPData(q, '', '').subscribe(
        (data: Object) => this.handleData(data, id),
        (error) => this.globalSettings.displayHTTPerror(error)
      );
    }
  }

  handleData(data: Object, id: string) {
    let ret = this.utHTTP.parseInfluxData(data, this.labelBlackListT);
    console.log(id, 'received', ret);
    if (ret['error']) {
      alert('Influx Error: ' + ret['error']);
      return;
    }
    this.labels[id] = ret['labels'];
    this.data[id] = ret['data'];
    // if (id == 'N') {
    //   const Ndata = this.data['N'];
    //   for (let r = 0; r < Ndata.length; r++) {
    //     Ndata[r][1] = this.h.smoothNO2(Ndata[r][1]);
    //   }
    // }
    if (id == 'H') {
      const Ndata = this.data['H'];
      for (let r = 0; r < Ndata.length; r++) {
        (Ndata[r][1] = Ndata[r][1] * 3), 6; // mps to km/h
      }
    }
    if (id == 'G') {
      const geojsonMarkerOptions = {
        radius: 3,
        fillColor: '#0000ff80',
        color: '#0000ff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
      };
      console.log('GPS!');
      this.gpslayers[0] = geoJSON(this.h.influx2geojsonPoints(ret['data']), {
        pointToLayer: function (feature, latlng) {
          return circleMarker(latlng, geojsonMarkerOptions);
        },
        onEachFeature: this.h.leafletPopup,
      });
    }

    // console.log(cloneDeep(this.dygLabels));
    this.startTimes[id] = this.userStartTime;
    this.changeTrigger = !this.changeTrigger;
  }
}
