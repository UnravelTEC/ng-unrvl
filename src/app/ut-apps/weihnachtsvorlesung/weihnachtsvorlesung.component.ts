import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../../core/local-storage.service';

@Component({
  selector: 'app-weihnachtsvorlesung',
  templateUrl: './weihnachtsvorlesung.component.html',
  styleUrls: ['./weihnachtsvorlesung.component.css']
})
export class WeihnachtsvorlesungComponent implements OnInit {
  serverHostName: string = 'http://koffer.lan';
  queryString: string = 'mic_audiolevel';
  dataBaseQueryStepMS: number = 100;
  timeRange: number = 60; // 1 min
  runningAvgSeconds = 0;
  fetchFromServerIntervalMS = 100;
  dataSeriesNames = ['miclvl'];

  annotations = [];

  constructor(private localStorage: LocalStorageService) {}

  ngOnInit() {
    this.annotations.push({
      series: 'audio$-name',
      x: new Date(),
      shortText: 'Start',
      text: 'Hier begann Alles…'
    });
  }
}
