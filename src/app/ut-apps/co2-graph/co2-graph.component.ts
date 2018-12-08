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
    top: '10vh',
    bottom: '5vh',
    left: '5vw',
    right: '5vw'
  };
}
