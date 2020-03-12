import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../core/helper-functions.service';
import { cloneDeep } from 'lodash-es';
import { LocalStorageService } from '../../core/local-storage.service';

@Component({
  selector: 'app-influx-test',
  templateUrl: './influx-test.component.html',
  styleUrls: ['./influx-test.component.scss']
})
export class InfluxTestComponent implements OnInit, OnDestroy {
  private appName = 'influx-test';

  public startTime = '15m';
  influxresponse: string;
  influxquery: string;
  labelstrings: string[];
  https = true;

  q = 'SELECT mean(/p(1|2.5|10)_ugpm3/) FROM particulate_matter WHERE time > now() - ' +
    this.startTime +
    ' GROUP BY sensor,time(30s)'


  extraDyGraphConfig = { connectSeparatedPoints: true, pointSize: 3 };

  public dygLabels = ['Date', 'sensor1-val1']; // , 'sensor2-val1', 'sensor2-val2'];
  public row1 = [new Date(new Date().valueOf() - 300100), 1]; //, null, null];
  public row2 = [new Date(new Date().valueOf() - 200000), 2]; // null, 1.2, 0.8];
  // public row3 = [new Date(new Date().valueOf() - 100000), 2, null, null];
  // public row4 = [new Date(), null, 2.2, 1.1];

  public dygData = [this.row1, this.row2]; // , this.row3, this.row4];
  // dygDataStr = '';

  changeTrigger = true;
  showResultText = false;

  private variablesToSave = [
    // 'queryString',
    // 'dataBaseQueryStepMS',
    'startTime',
    'showResultText'
    // 'endTime'
  ];

  constructor(
    private localStorage: LocalStorageService,
    private globalSettings: GlobalSettingsService,
    private h: HelperFunctionsService,
    private utHTTP: UtFetchdataService
  ) {
    this.globalSettings.emitChange({ appName: this.appName });
    // this.row2[2] = 1.2;
    // this.row2[3] = 0.8;
    // this.row4[2] = 2.2;
    // this.row4[3] = 1.1;
    // this.dygDataStr = JSON.stringify(this.dygData);
  }
  ngOnInit() {
    this.loadSettings();
    //let call = 'http://' + this.globalSettings.getHostName() + '.lan:8086/ping';

    this.launchQuery();
  }
  ngOnDestroy() {
    this.saveSettings();
  }

  buildQuery() {
    // let q: String;
    // q = 'SELECT * FROM "temperature" LIMIT 3';
    // q = 'SELECT LAST(sensor_degC),* FROM "temperature" GROUP BY *';
    // q = 'SELECT LAST(gamma_cps),* FROM "radiation" GROUP BY *';
    // q = 'SELECT * FROM "temperature" WHERE time > now() - 1m GROUP BY *';
    // q = 'SELECT * FROM "temperature" LIMIT 3';
    // q = 'SELECT LAST(*) FROM "temperature" GROUP BY *  ';
    // q =
    //   'SELECT * FROM gas WHERE time > now() - ' +
    //   this.startTime +
    //   ' GROUP BY *;';

    this.influxquery =
      (this.https ? 'https':'http' ) + '://' +
      this.globalSettings.server.serverName +
      '/influxdb/query?db='+this.globalSettings.server.influxdb+'&epoch=ms&q=' +
      this.q;
  }

  launchQuery() {
    this.buildQuery();
    console.log('calling', this.influxquery);
    this.utHTTP
      .getHTTPData(this.influxquery)
      .subscribe((data: Object) => this.printResult(data));
  }

  printResult(data: Object) {
    console.log(data);
    let ret = this.utHTTP.parseInfluxData(data);

    this.dygLabels = ret['labels'];
    console.log(cloneDeep(this.dygLabels));

    this.dygData = ret['data'];
    console.log(cloneDeep(this.dygData));

    // this.changeTrigger = !this.changeTrigger;

    if (this.dygData.length) {
      const dataset = data['results'][0]['series'][0];
      const metric = dataset.name;

      this.influxresponse =
        'metric: ' + metric + '\n' + JSON.stringify(data, undefined, 2);
    }
  }
  loadSettings() {
    let valueInLocalStorage;
    this.variablesToSave.forEach(elementName => {
      valueInLocalStorage = this.localStorage.get(this.appName + elementName);
      if (valueInLocalStorage) {
        this[elementName] = valueInLocalStorage;
      }
    });
  }
  saveSettings() {
    this.variablesToSave.forEach(elementName => {
      this.localStorage.set(this.appName + elementName, this[elementName]);
    });
    // alert('save ok');
  }
}
