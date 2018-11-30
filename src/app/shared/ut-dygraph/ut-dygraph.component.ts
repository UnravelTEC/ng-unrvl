import { Component, OnInit, Input } from '@angular/core';

import { interval, Subscription } from 'rxjs';

import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

declare const Dygraph: any;

@Component({
  selector: 'app-ut-dygraph',
  templateUrl: './ut-dygraph.component.html',
  styleUrls: ['./ut-dygraph.component.css']
})
export class UtDygraphComponent implements OnInit {
  // define on start what doesn't change
  @Input()
  //queryString: string;
  queryString: string = 'co2{location="FuzzyLab",sensor="scd30"}';
  @Input()
  dataSeriesNames: string[];
  @Input()
  graphHeight = '350'; // should be any css value
  @Input()
  graphWidth = '750'; // should be any css value
  @Input()
  YLabel = 'Value (unit)';
  @Input()
  timeRangeSeconds = 300; // in seconds, default 5min.
  @Input()
  dataBaseQueryStepMS = 1000; // query step on server
  @Input()
  fetchFromServerIntervalMS = 1000; // set 0 for no update - but can be changed later - default 1000ms.
  @Input()
  //serverHostName = 'koffer.lan'; // optional, defaults to localhost
  serverHostName = 'http://belinda.cgv.tugraz.at'; // optional, defaults to localhost
  @Input()
  serverPort = '9090'; // optional, defaults to 9090
  @Input()
  serverPath = '/api/v1/'; // optional, defaults to /api/v1/
  @Input()
  runningAvgSeconds = 0;
  @Input()
  debug: string = 'false';

  dyGraphOptions = {};
  displayedData = [];
  historicalData = [];
  dataBeginTime: Date;
  dataEndTime: Date;

  private RequestsUnderway = 0; // don't flood the server if it is not fast enough
  private noData = false;
  private waiting = true;

  Dygraph: any;

  intervalSubscription: Subscription;

  constructor(private utFetchdataService: UtFetchdataService) {}

  constructQueryEndpoint(
    server: string = this.serverHostName,
    port: string = this.serverPort,
    path: string = this.serverPath
  ) {
    const protAndHost = server.startsWith('http') ? server : 'http://' + server;
    return protAndHost + ':' + port + (path.startsWith('/') ? '' : '/') + path;
  }

  ngOnInit() {
    this.dyGraphOptions = {
      width: this.graphWidth,
      height: this.graphHeight,
      labels: ['Date'],
      xlabel: 'Time',
      ylabel: this.YLabel,
      title: '',
      animatedZooms: true,
      pointSize: 4
    };
    this.displayedData = [[undefined, null]];

    const dataEndTime = new Date();
    const dataBeginTime = new Date(
      dataEndTime.valueOf() - this.timeRangeSeconds * 1000
    );
    console.log(dataEndTime.valueOf() / 1000);

    this.utFetchdataService
      .getRange(
        this.queryString,
        dataBeginTime,
        dataEndTime,
        this.dataBaseQueryStepMS,
        this.constructQueryEndpoint()
      )
      .subscribe((displayedData: Object) =>
        this.handleInitialData(displayedData)
      );

    this.intervalSubscription = interval(
      this.fetchFromServerIntervalMS
    ).subscribe(counter => {
      this.fetchNewData();
    });
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
      console.log();
      this.intervalSubscription.unsubscribe();
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
        Number(element[1])
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

    this.waiting = false;
    this.Dygraph = new Dygraph(
      'graph',
      this.displayedData,
      this.dyGraphOptions
    );
    this.Dygraph.adjustRoll(this.runningAvgSeconds);

    console.log(this.dyGraphOptions);
    console.log(this.displayedData);
  }

  handleUpdatedData(displayedData: Object) {
    this.RequestsUnderway--;
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
          console.log('iterating on old number');
          return;
        } else {
          iteratingOnOldData = false;
        }
      }

      iteratedDate = new Date(currentDate);
      newData.push([iteratedDate, Number(element[1])]);
    });

    console.log('got ' + values.length + ' elements');
    console.log('new ' + newData.length + ' elements');

    // trigger ngOnChanges
    this.historicalData = this.historicalData.concat(newData);
    const dataLength = this.displayedData.length;
    console.log('current length: ' + dataLength + ' elements');
    this.displayedData = this.displayedData.concat(newData);
    this.displayedData = this.displayedData.slice(
      -dataLength,
      this.displayedData.length
    );
    console.log('new length: ' + this.displayedData.length + ' elements');
    this.Dygraph.updateOptions({ file: this.displayedData });
    this.Dygraph.adjustRoll(this.runningAvgSeconds);
    console.log(
      'historical length: ' + this.historicalData.length + ' elements'
    );
  }

  fetchNewData() {
    // console.log(this.RequestsUnderway);
    if (this.RequestsUnderway > 0) {
      console.log('not sending displayedData request, one on the way already');
      return;
    }
    if (this.RequestsUnderway > 2) {
      console.error('5 requests on the way, none returned, check server conn.');
      return;
    }
    this.RequestsUnderway++;

    const startDate = this.displayedData[this.displayedData.length - 1][0];
    if (!startDate) {
      console.error('error in fetchNewData: no previous data found');
      this.RequestsUnderway--;
      return;
    }
    this.utFetchdataService
      .getRange(
        this.queryString,
        startDate,
        new Date(),
        this.dataBaseQueryStepMS,
        this.constructQueryEndpoint()
      )
      .subscribe((displayedData: Object) =>
        this.handleUpdatedData(displayedData)
      );
  }
}
