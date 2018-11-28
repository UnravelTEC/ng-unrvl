import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dygraph-dev',
  templateUrl: './dygraph-dev.component.html',
  styleUrls: ['./dygraph-dev.component.css']
})
export class DygraphDevComponent implements OnInit {
  Server: string = 'http://henri0.lan';
  QueryString: string = 'scd30_co2';
  dataFrequency: number = 1000;
  timeRange: number = 300; // 5 min

  constructor() {}

  ngOnInit() {}
}
