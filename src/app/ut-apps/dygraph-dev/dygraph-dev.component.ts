import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../../core/local-storage.service';

@Component({
  selector: 'app-dygraph-dev',
  templateUrl: './dygraph-dev.component.html',
  styleUrls: ['./dygraph-dev.component.css']
})
export class DygraphDevComponent implements OnInit {
  serverHostName: string = 'https://scpexploratory02.tugraz.at';
  queryString: string = 'sensor_radiation_Sv';
  dataBaseQueryStepMS: number = 1000;
  startTime: string = '60s';
  endTime: string = 'now';
  serverPort = '443';
  serverPath = 'prometheus/api/v1/';
  runningAvgSeconds = 0;
  fetchFromServerIntervalMS = 1000;

  private variablesToSave = [
    'serverHostName',
    'queryString',
    'dataBaseQueryStepMS',
    'startTime',
    'endTime',
    'runningAvgSeconds',
    'fetchFromServerIntervalMS'
  ];

  constructor(private localStorage: LocalStorageService) {}

  ngOnInit() {
    let valueInLocalStorage;
    this.variablesToSave.forEach(elementName => {
      valueInLocalStorage = this.localStorage.get(elementName);
      if (valueInLocalStorage) {
        this[elementName] = valueInLocalStorage;
      }
    });
  }

  save() {
    this.variablesToSave.forEach(elementName => {
      this.localStorage.set(elementName, this[elementName]);
    });
  }
  reset() {
    this.variablesToSave.forEach(elementName => {
      this.localStorage.delete(elementName);
    });
  }
}
