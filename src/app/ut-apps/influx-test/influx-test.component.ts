import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../core/helper-functions.service';
import { cloneDeep } from 'lodash-es';
import { LocalStorageService } from '../../core/local-storage.service';

@Component({
  selector: 'app-influx-test',
  templateUrl: './influx-test.component.html',
  styleUrls: ['./influx-test.component.scss'],
})
export class InfluxTestComponent implements OnInit, OnDestroy {
  private appName = 'influx-test';

  public startTime = '15m';
  influxresponse: string;
  influxquery: string;
  labelstrings: string[];
  https = true;

  /* variables:
   * colums: *, /regex/
   * measuerement, eg gas
   * starttime / range / mean
   */
  queries = [
    'SELECT mean(*) FROM particulate_matter WHERE time > now() - {{T}} GROUP BY sensor,time(30s);' +
      'SELECT mean(*) FROM gas WHERE time > now() - {{T}} GROUP BY sensor,time(30s);' +
      'SELECT mean(*) FROM temperature WHERE time > now() - {{T}} GROUP BY sensor,time(30s);',
    'SELECT mean(/p(1|2.5|10)_ugpm3/) FROM particulate_matter WHERE time > now() - {{T}} GROUP BY sensor,time(30s);',
    'SELECT LAST(*) FROM "temperature" GROUP BY *;',
    'SELECT * FROM gas WHERE time > now() - {{T}} GROUP BY *;',
  ];

  // q = 'SELECT * FROM "temperature" LIMIT 3';
  // q = 'SELECT LAST(sensor_degC),* FROM "temperature" GROUP BY *';
  // q = 'SELECT LAST(gamma_cps),* FROM "radiation" GROUP BY *';
  // q = 'SELECT * FROM "temperature" WHERE time > now() - 1m GROUP BY *';
  // q = 'SELECT * FROM "temperature" LIMIT 3';
  // q =

  q = this.queries[1];

  extraDyGraphConfig = { connectSeparatedPoints: true, pointSize: 3 };

  public dygLabels = [];
  public dygData = [];

  changeTrigger = 0;
  showResultText = false;

  private variablesToSave = [
    // 'queryString',
    // 'dataBaseQueryStepMS',
    'startTime',
    'showResultText',
    'q',
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

    this.reload();
  }
  chooseQuery(query) {
    this.q = query;
  }

  reload() {
    this.launchQuery(this.q);
  }

  ngOnDestroy() {
    this.saveSettings();
  }

  launchQuery(clause: string) {
    if (!this.globalSettings.influxReady()) {
      setTimeout(() => {
        this.launchQuery(clause);
      }, 1000);
      return;
    }

    const qWithTime = clause.replace(/{{T}}/g, this.startTime);
    const q = this.utHTTP.buildInfluxQuery(qWithTime);
    this.utHTTP.getHTTPData(q).subscribe(
      (data: Object) => this.printResult(data),
      (error) => this.globalSettings.displayHTTPerror(error)
    );
  }

  printResult(data: Object) {
    console.log(cloneDeep(data));
    let ret = this.utHTTP.parseInfluxData(data);
    if (ret['error']) {
      alert('Influx Error: ' + ret['error']);
      return;
    }

    this.dygLabels = ret['labels'];
    console.log(cloneDeep(this.dygLabels));

    this.dygData = ret['data'];
    console.log(cloneDeep(this.dygData));

    // this.changeTrigger += 1;

    if (this.dygData.length) {
      const dataset = data['results'][0]['series'][0];
      const metric = dataset.name;

      this.influxresponse =
        'metric: ' + metric + '\n' + JSON.stringify(data, undefined, 2);
    }
  }
  loadSettings() {
    let valueInLocalStorage;
    this.variablesToSave.forEach((elementName) => {
      valueInLocalStorage = this.localStorage.get(this.appName + elementName);
      if (valueInLocalStorage) {
        this[elementName] = valueInLocalStorage;
      }
    });
  }
  saveSettings() {
    this.variablesToSave.forEach((elementName) => {
      this.localStorage.set(this.appName + elementName, this[elementName]);
    });
    // alert('save ok');
  }
}
