import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-weihnachtsvorlesung',
  templateUrl: './weihnachtsvorlesung.component.html',
  styleUrls: ['./weihnachtsvorlesung.component.css']
})
export class WeihnachtsvorlesungComponent implements OnInit {
  serverHostName: string = 'http://henri0.lan';
  queryString: string = 'veml6075_uva';
  dataBaseQueryStepMS: number = 100;
  timeRange: number = 60; // 1 min
  runningAvgSeconds = 0;
  fetchFromServerIntervalMS = 100;

  constructor() { }

  ngOnInit() {
  }

}
