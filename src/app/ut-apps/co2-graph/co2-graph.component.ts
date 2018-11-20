import { Component, OnInit } from '@angular/core';

import { NgDygraphsModule } from 'ng-dygraphs';

import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

@Component({
  selector: 'app-co2-graph',
  templateUrl: './co2-graph.component.html',
  styleUrls: ['./co2-graph.component.css']
})
export class Co2GraphComponent implements OnInit {
  queryString = 'co2{location="FuzzyLab",sensor="scd30"}';

  data = [];

  options = {
    width: '750',
    height: '350',
    labels: ['Date', 'SCD30'],
    xlabel: 'Time',
    ylabel: 'CO₂ (ppm)',
    title: '',
    animatedZooms: true,
    pointSize: 4
  };

  constructor(private utFetchdataService: UtFetchdataService) {}
  ngOnInit() {
    console.log('calling http');

    const starttime = new Date();
    const endtime = new Date(); // now
    starttime.setSeconds(endtime.getSeconds() - 600);

    this.utFetchdataService
      .getRange(this.queryString, starttime, endtime, 3000)
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

    this.options.labels[1] = metric['location'] + ' ' + metric['sensor'];
    if (!this.options.labels[1]) {
      this.options.labels[1] = 'undefined';
    }

    console.log(this.data);
  }
}
