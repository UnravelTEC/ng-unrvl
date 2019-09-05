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
  queryString = 'system_load';
  dataBaseQueryStepMS = 5000;
  startTime = '30m';
  endTime = 'now';
  serverPort = '';
  serverPath = 'prometheus/api/v1/';
  runningAvgPoints = 0;
  fetchFromServerIntervalMS = 5000;

  style = {
    position: 'absolute',
    top: '1vh',
    bottom: '25vh',
    left: '0',
    right: '0'
  };

  private variablesToSave = [
    'serverHostName',
    'queryString',
    'dataBaseQueryStepMS',
    'startTime',
    'endTime',
    'runningAvgPoints',
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
