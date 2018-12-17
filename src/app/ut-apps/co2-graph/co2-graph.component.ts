import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-co2-graph',
  templateUrl: './co2-graph.component.html',
  styleUrls: ['./co2-graph.component.css']
})
export class Co2GraphComponent implements OnInit {
  constructor() {}
  ngOnInit() {}

  graphstyle = {
    position: 'absolute',
    top: '3rem',
    bottom: '3rem',
    left: '5vw',
    right: '5vw'
  };
  dataSeriesLabels = ['CO2'];
  startTime = '15m';
}
