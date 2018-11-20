import { Component, OnInit, Input } from '@angular/core';

import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

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
  graphHeight: string = '350'; // should be any css value
  @Input()
  graphWidth: string = '750'; // should be any css value
  @Input()
  YLabel: string = 'Value (unit)';
  @Input()
  timeRange: number = 300; // in seconds, default 5min.
  @Input()
  updateRate: number = 1000; // set 0 for no update - but can be changed later - default 1000ms.
  @Input()
  Server: string = 'http://belinda.cgv.tugraz.at'; // optional, defaults to localhost:9090

  private queryEndpoint: string;

  dyOptions = {};
  data = [];

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
      pointSize: 4
    };
    this.queryEndpoint = this.Server + ':9090/api/v1/';

    const starttime = new Date();
    const endtime = new Date(); // now
    starttime.setSeconds(endtime.getSeconds() - this.timeRange);

    this.utFetchdataService
      .getRange(
        this.queryString,
        starttime,
        endtime,
        this.updateRate,
        this.queryEndpoint
      )
      .subscribe((data: Object) => this.handleReceivedData(data));
  }

  handleReceivedData(data: Object) {
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

    console.log(this.data);
  }
}
