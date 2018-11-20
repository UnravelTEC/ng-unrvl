import { Component, OnInit } from '@angular/core';

import { NgDygraphsModule } from 'ng-dygraphs';

import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

@Component({
  selector: 'app-co2-graph',
  templateUrl: './co2-graph.component.html',
  styleUrls: ['./co2-graph.component.css']
})
export class Co2GraphComponent implements OnInit {
  constructor(private utFetchdataService: UtFetchdataService) { }

  queryString = 'co2{location="FuzzyLab",sensor="scd30"}'

  data = [];

  options = {};

  ngOnInit() {
    console.log('calling http');

    this.data = [
      [new Date('2008/05/07'), 75],
      [new Date('2008/05/08'), 70],
      [new Date('2008/05/09'), 80]
    ];
    console.log(this.data);
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

    let starttime = new Date();
    let endtime = new Date();
    starttime.setSeconds(endtime.getSeconds() - 600);


    this.utFetchdataService
      .getRange(this.queryString, starttime, endtime, 3000)
      .subscribe((data: Object) => this.handleReceivedData(data));
  }

  handleReceivedData(data: Object) {
    console.log('received Data:');
    console.log(data);
    let metric = data['data']['result'][0]['metric'];
    let values = data['data']['result'][0]['values']
    this.data = [];
    console.log(values);
    values.forEach(element => {
      this.data.push(
        [
          new Date(element[0] * 1000),
          Number(element[1])
        ])
    });
    console.log(this.data);
  }
}
