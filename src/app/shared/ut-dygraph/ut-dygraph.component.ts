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
  queryString: string;
  @Input()
  graphHeight = '350'; // should be any css value
  @Input()
  graphWidth = '750'; // should be any css value
  @Input()
  YLabel = 'Value (unit)';
  @Input()
  timeRange = 300; // in seconds, default 5min.
  @Input()
  dataFrequency = 3000; // query step on server
  @Input()
  frontendRefreshRate = 1000; // set 0 for no update - but can be changed later - default 1000ms.
  @Input()
  Server = 'http://belinda.cgv.tugraz.at'; // optional, defaults to localhost:9090
  @Input()
  RunningAvg = 2;

  private queryEndpoint: string;

  dyOptions = {};
  data = [];
  historicalData = [];
  dataBeginTime: Date;
  dataEndTime: Date;

  private requests_underway = 0; // don't flood the server if it is not fast enough

  _graph: any;

  intervalSubscription: Subscription;

  constructor(private utFetchdataService: UtFetchdataService) {}

  ngOnInit() {
    this.dyOptions = {
      width: this.graphWidth,
      height: this.graphHeight,
      labels: ['Date', 'SensorX'],
      xlabel: 'Time',
      ylabel: this.YLabel,
      title: '',
      animatedZooms: true,
      pointSize: 4,
      noDataLabel: 'Loading...'
    };
    this.data = [[undefined, null]];
    this.queryEndpoint = this.Server + ':9090/api/v1/';

    const dataEndTime = new Date();
    const dataBeginTime = new Date(
      dataEndTime.valueOf() - this.timeRange * 1000
    );
    console.log(dataEndTime.valueOf() / 1000);

    this.utFetchdataService
      .getRange(
        this.queryString,
        dataBeginTime,
        dataEndTime,
        this.dataFrequency,
        this.queryEndpoint
      )
      .subscribe((data: Object) => this.handleInitialData(data));

      this.intervalSubscription = interval(this.frontendRefreshRate).subscribe(counter => {
        this.fetchNewData();
      });
  }

  handleInitialData(data: Object) {
    console.log('received Data:');
    console.log(data);

    const metric = data['data']['result'][0]['metric'];
    const values = data['data']['result'][0]['values'];

    this.data = [];
    values.forEach(element => {
      this.data.push([new Date(element[0] * 1000), Number(element[1])]);
    });

    this.dyOptions['labels'][1] = metric['location'] + ' ' + metric['sensor'];
    if (!this.dyOptions['labels'][1]) {
      this.dyOptions['labels'][1] = 'undefined';
    }

    this.historicalData = this.data;

    this._graph = new Dygraph('graph', this.data, this.dyOptions);
    this._graph.adjustRoll(this.RunningAvg);

    console.log(this.data);
  }

  handleUpdatedData(data: Object) {
    this.requests_underway--;
    const values = data['data']['result'][0]['values'];

    // check if there is already newer data from an earlier request
    let iteratedDate: Date;
    let iteratingOnOldData = true;
    let lastDate: number; // mseconds since 1970
    let currentDate: number; // mseconds since 1970
    let newData = [];
    values.forEach(element => {
      currentDate = element[0] * 1000;

      if (iteratingOnOldData) {
        lastDate = this.data[this.data.length - 1][0].valueOf();
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
    const dataLength = this.data.length;
    console.log('current length: ' + dataLength + ' elements');
    this.data = this.data.concat(newData);
    this.data = this.data.slice(-dataLength, this.data.length);
    console.log('new length: ' + this.data.length + ' elements');
    this._graph.updateOptions({ file: this.data });
    console.log('historical length: ' + this.historicalData.length + ' elements');
  }

  fetchNewData() {
    // console.log(this.requests_underway);
    if (this.requests_underway > 0) {
      console.log('not sending data request, one on the way already');
      return;
    }
    if (this.requests_underway > 2) {
      console.error('5 requests on the way, none returned, check server conn.');
      return;
    }
    this.requests_underway++;

    this.utFetchdataService
      .getRange(
        this.queryString,
        this.data[this.data.length - 1][0], // [0] is a date object
        new Date(),
        this.dataFrequency,
        this.queryEndpoint
      )
      .subscribe((data: Object) => this.handleUpdatedData(data));
  }
}
