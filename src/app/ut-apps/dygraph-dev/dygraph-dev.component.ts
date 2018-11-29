import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dygraph-dev',
  templateUrl: './dygraph-dev.component.html',
  styleUrls: ['./dygraph-dev.component.css']
})
export class DygraphDevComponent implements OnInit {
  serverHostName: string = 'http://koffer.lan';
  queryString: string = 'veml6075_uva';
  dataBaseQueryStepMS: number = 100;
  timeRange: number = 60; // 1 min
  runningAvgSeconds = 0;
  fetchFromServerIntervalMS = 100;

  constructor() {}

  ngOnInit() {}
}
