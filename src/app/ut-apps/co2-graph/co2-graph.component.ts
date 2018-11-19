import { Component, OnInit } from '@angular/core';

import { NgDygraphsModule } from 'ng-dygraphs';

@Component({
  selector: 'app-co2-graph',
  templateUrl: './co2-graph.component.html',
  styleUrls: ['./co2-graph.component.css']
})
export class Co2GraphComponent implements OnInit {
  constructor() {}

  data = [];

  options = {};

  ngOnInit() {
    this.data = [
      [new Date('2008/05/07'), 75],
      [new Date('2008/05/08'), 70],
      [new Date('2008/05/09'), 80]
    ];
    this.options = {
      width: '750',
      height: '350',
      labels: ['Date', 'SCD30'],
      xlabel: 'X label text',
      ylabel: 'CO₂ (ppm)',
      title: '',
      animatedZooms: true,
      pointSize: 4
    };
  }
}