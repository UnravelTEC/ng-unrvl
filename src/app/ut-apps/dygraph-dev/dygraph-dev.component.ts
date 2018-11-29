import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dygraph-dev',
  templateUrl: './dygraph-dev.component.html',
  styleUrls: ['./dygraph-dev.component.css']
})
export class DygraphDevComponent implements OnInit {
  Server: string = 'http://henri0.lan';
  QueryString: string = 'veml6075_uva';
  DataBaseQueryStepMS: number = 100;
  timeRange: number = 60; // 1 min
  RunningAvgSeconds = 0;

  constructor() {}

  ngOnInit() {}
}
