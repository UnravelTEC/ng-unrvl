import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

import { interval, Subscription } from 'rxjs';
import Dygraph from 'dygraphs';

import { UtFetchdataService } from '../../shared/ut-fetchdata.service';
import { LocalStorageService } from '../../core/local-storage.service';
import { HelperFunctionsService } from '../../core/helper-functions.service';

@Component({
  selector: 'app-ut-dygraph',
  templateUrl: './ut-dygraph.component.html',
  styleUrls: ['./ut-dygraph.component.css'],
  encapsulation: ViewEncapsulation.None // from https://coryrylan.com/blog/css-encapsulation-with-angular-components
})
export class UtDygraphComponent implements OnInit {
  // define on start what doesn't change
  @Input()
  // queryString: string;
  queryString = 'co2{location="FuzzyLab",sensor="scd30"}';
  @Input()
  dataSeriesNames: string[];

  // set eigher height+width or a position object
  @Input()
  graphHeight: string; // = '350'; // should be any css value
  @Input()
  graphWidth: string; // = '750'; // should be any css value
  @Input()
  style = {
    position: undefined,
    top: undefined,
    bottom: undefined,
    left: undefined,
    right: undefined
  };

  @Input()
  YLabel = 'Value (unit)';
  @Input()
  endTime = 'now';
  @Input()
  startTime = '15m'; // prefix m for min, s for seconds, h for hours, d for days
  @Input()
  dataBaseQueryStepMS = 1000; // query step on server
  @Input()
  fetchFromServerIntervalMS = 1000; // set 0 for no update - but can be changed later - default 1000ms.
  @Input()
  // serverHostName = 'koffer.lan'; // optional, defaults to localhost
  serverHostName: string; // optional, defaults to localhost
  @Input()
  serverPort = '9090'; // optional, defaults to 9090
  @Input()
  serverPath = '/api/v1/'; // optional, defaults to /api/v1/
  @Input()
  runningAvgSeconds = 0;
  @Input()
  debug = 'false';
  @Input()
  annotations: Array<Object>;
  @Input()
  extraDyGraphConfig: Object;
  @Input()
  multiplicateFactors = [1];

  dyGraphOptions = {
    // http://dygraphs.com/options.html
    labels: ['Date'], // one element needed for further code.
    xlabel: 'Time',
    title: '',
    animatedZooms: true,
    pointSize: 4,
    hideOverlayOnMouseOut: true,
    legend: 'always'
  };
  displayedData = [];
  historicalData = [];
  dataBeginTime: Date;
  dataEndTime: Date;
  average: number;

  public noData = false;
  public waiting = true;
  public error: string = undefined;
  public htmlID: string;
  private requestsUnderway = 0; // don't flood the server if it is not fast enough
  private queryEndPoint: string;

  Dygraph: any;

  intervalSubscription: Subscription;

  constructor(
    private utFetchdataService: UtFetchdataService,
    private localStorage: LocalStorageService,
    private h: HelperFunctionsService
  ) {}

  constructQueryEndpoint(
    server: string = this.serverHostName,
    port: string = this.serverPort,
    path: string = this.serverPath
  ) {
    if (!server) {
      const globalSettings = this.localStorage.get('globalSettings');
      console.log(globalSettings);
      const globalServer = this.h.getDeep(globalSettings, [
        'server',
        'settings',
        'serverHostName',
        'fieldValue'
      ]);

      if (globalServer) {
        console.log('global Server: ' + globalServer);
        server = globalServer;
      }
    }
    if (server.endsWith('/')) {
      console.error('servername has to be without slash(/) at the end!');
    }
    const protAndHost = server.startsWith('http') ? server : 'http://' + server;
    return protAndHost + ':' + port + (path.startsWith('/') ? '' : '/') + path;
  }

  ngOnInit() {
    this.dyGraphOptions['ylabel'] = this.YLabel;
    this.dyGraphOptions.labels[1] = this.queryString;

    for (const key in this.extraDyGraphConfig) {
      if (this.extraDyGraphConfig.hasOwnProperty(key)) {
        this.dyGraphOptions[key] = this.extraDyGraphConfig[key];
      }
    }

    this.displayedData = [[undefined, null]];
    this.htmlID = 'graph_' + (Math.random() + 1).toString();

    console.log(this.endTime);
    const dataEndTime =
      this.endTime === 'now' ? new Date() : new Date(this.endTime);

    let seconds = this.parseToSeconds(this.startTime);

    let dataBeginTime;
    if (seconds) {
      dataBeginTime = new Date(dataEndTime.valueOf() - seconds * 1000);
      console.log('length of interval displayed (s): ' + seconds.toString());
    } else {
      dataBeginTime = new Date(this.startTime);
    }

    console.log('dataEndTime ' + (dataEndTime.valueOf() / 1000).toString());

    this.queryEndPoint = this.constructQueryEndpoint();

    this.utFetchdataService
      .getRange(
        this.queryString,
        dataBeginTime,
        dataEndTime,
        this.dataBaseQueryStepMS,
        this.queryEndPoint
      )
      .subscribe(
        (displayedData: Object) => this.handleInitialData(displayedData),
        error => this.handlePrometheusErrors(error)
      );
  }

  parseToSeconds(inputString: string): number {
    let seconds = 0;
    if (
      inputString.endsWith('s') &&
      parseInt(inputString.slice(0, -1), 10) > 0
    ) {
      seconds = parseInt(inputString.slice(0, -1), 10);
    }
    if (
      inputString.endsWith('m') &&
      parseInt(inputString.slice(0, -1), 10) > 0
    ) {
      seconds = parseInt(inputString.slice(0, -1), 10) * 60;
    }
    if (
      inputString.endsWith('h') &&
      parseInt(inputString.slice(0, -1), 10) > 0
    ) {
      seconds = parseInt(inputString.slice(0, -1), 10) * 60 * 60;
    }
    if (
      inputString.endsWith('d') &&
      parseInt(inputString.slice(0, -1), 10) > 0
    ) {
      seconds = parseInt(inputString.slice(0, -1), 10) * 60 * 60 * 24;
    }
    return seconds;
  }

  handlePrometheusErrors(error) {
    console.log(error);
    this.waiting = false;
    if (error['headers']) {
      console.log('headers:');
      console.log(JSON.stringify(error['headers']));
    }
    if (error['message']) {
      console.log(error['message']);
      this.error = error['message'];
    }
    if (error['error']) {
      if (error['error']['target']) {
        console.log(error['error']['target']);
        if (error['error']['target']['__zone_symbol__xhrURL']) {
          this.error +=
            '\n' + error['error']['target']['__zone_symbol__xhrURL'];
        }
      }
      if (error['error']['error']) {
        console.log(
          error['error']['errorType'] + ': ' + error['error']['error']
        );
        if (
          error['error']['error'].search(
            /Try decreasing the query resolution/
          ) > -1
        ) {
          this.error += 'too many points';
          this.intervalSubscription.unsubscribe();
          return;
        }
      }
    } else this.error = 'unknown error';
  }

  handleInitialData(receivedData: Object) {
    console.log('received Data:');
    console.log(receivedData);

    if (
      !receivedData['data'] ||
      !receivedData['data']['result'] ||
      !receivedData['data']['result'][0] ||
      !receivedData['data']['result'][0]['metric'] ||
      !receivedData['data']['result'][0]['values']
    ) {
      console.log('Error: no valid data received.');
      console.log(receivedData);
      this.noData = true;
      this.waiting = false;
      return;
    }
    const metric = receivedData['data']['result'][0]['metric'];
    const values = receivedData['data']['result'][0]['values'];

    this.displayedData = [];
    values.forEach(element => {
      this.displayedData.push([
        new Date(element[0] * 1000),
        Number(element[1]) * this.multiplicateFactors[0]
      ]);
    });

    if (this.dataSeriesNames && this.dataSeriesNames.length) {
      this.dyGraphOptions['labels'] = this.dyGraphOptions['labels'].concat(
        this.dataSeriesNames
      );
    } else {
      if (metric['location']) {
        this.dyGraphOptions['labels'][1] = metric['location'];
      }

      if (metric['sensor']) {
        this.dyGraphOptions['labels'][1] += ' ' + metric['sensor'];
      }
      if (!this.dyGraphOptions['labels'][1]) {
        this.dyGraphOptions['labels'][1] = 'undefined';
      }
    }

    this.historicalData = this.displayedData;
    this.calculateAverage();

    this.waiting = false;
    this.Dygraph = new Dygraph(
      this.htmlID,
      this.displayedData,
      this.dyGraphOptions
    );
    this.Dygraph.adjustRoll(this.runningAvgSeconds);

    if (this.annotations) {
      this.adjustAnnotationsXtoMS();
      this.Dygraph.setAnnotations(this.annotations);
    }

    console.log(this.dyGraphOptions);
    console.log(this.displayedData);

    if (this.fetchFromServerIntervalMS > 0) {
      this.intervalSubscription = interval(
        this.fetchFromServerIntervalMS
      ).subscribe(counter => {
        this.fetchNewData();
      });
    }
  }

  calculateAverage() {
    if (!this.displayedData.length) {
      return;
    }
    let sum = 0;
    for (let i = 0; i < this.displayedData.length; i++) {
      sum += this.displayedData[i][1];
    }
    this.average = sum / this.displayedData.length;
  }

  handleUpdatedData(displayedData: Object) {
    this.requestsUnderway--;
    if (
      !displayedData ||
      !displayedData['data'] ||
      !displayedData['data']['result'] ||
      !displayedData['data']['result'][0] ||
      !displayedData['data']['result'][0]['values']
    ) {
      console.error('handleUpdatedData: input object wrong');
      console.log(displayedData);
      return;
    }
    const values = displayedData['data']['result'][0]['values'];

    // check if there is already newer data from an earlier request
    let iteratedDate: Date;
    let iteratingOnOldData = true;
    let lastDate: number; // mseconds since 1970
    let currentDate: number; // mseconds since 1970
    const newData = [];
    values.forEach(element => {
      currentDate = element[0] * 1000;

      if (iteratingOnOldData) {
        lastDate = this.displayedData[
          this.displayedData.length - 1
        ][0].valueOf();
        if (lastDate >= currentDate) {
          // console.log('iterating on old number');
          return;
        } else {
          iteratingOnOldData = false;
        }
      }

      iteratedDate = new Date(currentDate);
      newData.push([
        iteratedDate,
        Number(element[1]) * this.multiplicateFactors[0]
      ]);
    });

    // console.log('got ' + values.length + ' elements');
    // console.log('new ' + newData.length + ' elements');

    // trigger ngOnChanges
    this.historicalData = this.historicalData.concat(newData);
    const dataLength = this.displayedData.length;
    // console.log('current length: ' + dataLength + ' elements');
    this.displayedData = this.displayedData.concat(newData);
    this.displayedData = this.displayedData.slice(
      -dataLength,
      this.displayedData.length
    );
    // console.log('new length: ' + this.displayedData.length + ' elements');
    this.Dygraph.updateOptions({ file: this.displayedData });
    this.Dygraph.adjustRoll(this.runningAvgSeconds);
    // console.log(      'historical length: ' + this.historicalData.length + ' elements'    );
    // console.log(this.annotations)
    if (this.annotations) {
      this.adjustAnnotationsXtoMS();
      this.Dygraph.setAnnotations(this.annotations);
    }
    this.calculateAverage();
  }

  fetchNewData() {
    // console.log(this.requestsUnderway);
    if (this.requestsUnderway > 0) {
      console.log('not sending displayedData request, one on the way already');
      return;
    }
    if (this.requestsUnderway > 2) {
      console.error('5 requests on the way, none returned, check server conn.');
      return;
    }
    this.requestsUnderway++;

    const startDate = this.displayedData[this.displayedData.length - 1][0];
    if (!startDate) {
      // unsure if needed, because now interval is only triggered when initial data here.
      console.log(startDate);
      console.error('error in fetchNewData: no previous data found');
      this.requestsUnderway--;
      return;
    }
    this.utFetchdataService
      .getRange(
        this.queryString,
        startDate,
        new Date(),
        this.dataBaseQueryStepMS,
        this.queryEndPoint
      )
      .subscribe((displayedData: Object) =>
        this.handleUpdatedData(displayedData)
      );
  }

  adjustAnnotationsXtoMS() {
    this.annotations.forEach(annotation => {
      if (annotation['adjusted'] !== true) {
        console.log('old annotation: ' + annotation['x']);
        const [lower, upper] = this.binarySearchNearDate(
          this.displayedData,
          annotation['x']
        );
        annotation['x'] = this.displayedData[lower][0].valueOf();
        console.log('lower: ' + annotation['x']);
        console.log('upper: ' + this.displayedData[upper][0].valueOf());
        annotation['adjusted'] = true;
      }
    });
  }

  // array must be consecutive!
  // returns the two indizes in which between the searched Date is
  binarySearchNearDate(
    inputArray: Array<[Date, any]>,
    target: Date,
    ObjectPath?: String
  ) {
    let lowerIndex = 0,
      upperIndex = inputArray.length - 1;

    function compareDate(date1: Date, date2: Date) {
      if (date1.valueOf() === date2.valueOf()) {
        return 0;
      }
      return date1.valueOf() > date2.valueOf() ? 1 : -1;
    }

    while (lowerIndex + 1 < upperIndex) {
      const halfIndex = (lowerIndex + upperIndex) >> 1; // tslint:disable-line
      const halfElem = inputArray[halfIndex][0];

      const comparisonResult = compareDate(target, halfElem);
      if (comparisonResult === 0) {
        lowerIndex = halfIndex;
        upperIndex = halfIndex;
        break;
      }
      if (comparisonResult > 0) {
        lowerIndex = halfIndex;
      } else {
        upperIndex = halfIndex;
      }
    }

    return [lowerIndex, upperIndex];
  }
}
