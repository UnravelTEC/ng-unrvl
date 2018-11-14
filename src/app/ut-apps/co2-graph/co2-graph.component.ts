import { Component, OnInit } from '@angular/core';

import { NgDygraphsModule } from 'ng-dygraphs';

@Component({
  selector: 'app-co2-graph',
  templateUrl: './co2-graph.component.html',
  styleUrls: ['./co2-graph.component.css']
})
export class Co2GraphComponent implements OnInit {
  constructor() {}

  data = [
    [new Date('2008/05/07'), 75],
    [new Date('2008/05/08'), 70],
    [new Date('2008/05/09'), 80]
  ];

  options = {
    width: 'auto',
    labels: ['Date', 'Temperature'],
    xlabel: 'X label text',
    ylabel: 'Y label text',
    title: 'Working title :)',
    animatedZooms: true,
    pointSize: 4
  };

  ngOnInit() {}
}
