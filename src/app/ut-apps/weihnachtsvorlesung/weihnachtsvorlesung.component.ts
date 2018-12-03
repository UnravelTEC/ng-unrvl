import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../../core/local-storage.service';

@Component({
  selector: 'app-weihnachtsvorlesung',
  templateUrl: './weihnachtsvorlesung.component.html',
  styleUrls: ['./weihnachtsvorlesung.component.css']
})
export class WeihnachtsvorlesungComponent implements OnInit {
  // serverHostName: string = 'http://koffer.lan';
  // serverHostName: string = 'http://belinda.cgv.tugraz.at'
  serverHostName: string = 'https://scpexploratory02.tugraz.at';
  // queryString: string = 'mic_audiolevel';
  // queryString: string = 'co2{location="FuzzyLab",sensor="scd30"}'
  queryString: string = 'sensor_radiation_Sv';
  dataBaseQueryStepMS: number = 1000;
  timeRange: number = 60; // 1 min
  runningAvgSeconds = 0;
  fetchFromServerIntervalMS = 1000;
  dataSeriesNames = ['miclvl'];

  //end2 = '2018-12-03 15:00';
  end2 = 'now';
  start2 = '2018-12-03 12:00';
  extraDyGraphConfig2 = {
    dateWindow: [
      new Date('2018-12-03 13:00'), // earliest
      new Date('2018-12-03 16:00') // latest
    ]
  };
  annotations = [];

  constructor(private localStorage: LocalStorageService) {}

  ngOnInit() {
    this.annotations.push({
      series: 'miclvl',
      x: new Date().getTime(),
      shortText: 'Start',
      text: 'Hier begann Alles…'
    });
  }
}
