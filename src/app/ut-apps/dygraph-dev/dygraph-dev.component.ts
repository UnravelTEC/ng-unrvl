import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../../core/local-storage.service';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-dygraph-dev',
  templateUrl: './dygraph-dev.component.html',
  styleUrls: ['./dygraph-dev.component.css']
})
export class DygraphDevComponent implements OnInit {
  serverHostName = '';
  queryString = 'temperature_degC';
  dataBaseQueryStepMS = 2000;
  startTime = '30m';
  endTime = 'now';
  serverPort = '';
  serverPath = 'prometheus/api/v1/';
  runningAvgSeconds = 0;
  fetchFromServerIntervalMS = 2000;

  style = {
    position: 'absolute',
    top: '3rem',
    bottom: '35vh',
    left: '5vw',
    right: '5vw'
  };

  private variablesToSave = [
    'serverHostName',
    'queryString',
    'dataBaseQueryStepMS',
    'startTime',
    'endTime',
    'runningAvgSeconds',
    'fetchFromServerIntervalMS'
  ];

  constructor(
    private localStorage: LocalStorageService,
    private globalSettings: GlobalSettingsService
  ) {
    // has to be here instead of ngOnInit, otherwise ExpressionChangedAfterItHasBeenCheckedError
    this.globalSettings.emitChange({ appName: 'DyGraph Dev App' });
  }

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
    alert('save ok');
  }
  reset() {
    this.variablesToSave.forEach(elementName => {
      this.localStorage.delete(elementName);
    });
    alert('reset ok');
  }
}
