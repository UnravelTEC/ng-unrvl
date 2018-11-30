import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../../core/local-storage.service';

@Component({
  selector: 'app-dygraph-dev',
  templateUrl: './dygraph-dev.component.html',
  styleUrls: ['./dygraph-dev.component.css']
})
export class DygraphDevComponent implements OnInit {
  serverHostName: string = 'http://henri0.lan';
  queryString: string = 'veml6075_uva';
  dataBaseQueryStepMS: number = 100;
  timeRange: number = 60; // 1 min
  runningAvgSeconds = 0;
  fetchFromServerIntervalMS = 100;

  private variablesToSave = [
    'serverHostName',
    'queryString',
    'dataBaseQueryStepMS',
    'timeRange',
    'runningAvgSeconds',
    'fetchFromServerIntervalMS'
  ];

  constructor(private localStorage: LocalStorageService) {}

  ngOnInit() {
    var valueInLocalStorage;
    this.variablesToSave.forEach(elementName => {
      valueInLocalStorage = this.localStorage.get(elementName);
      if (valueInLocalStorage) {
        this[elementName] = valueInLocalStorage;
      }
    });
  }

  save() {
    this.variablesToSave.forEach(elementName => {
      this.localStorage.set(elementName, this[elementName];
    });
  }
}
