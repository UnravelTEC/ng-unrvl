import { Component, OnInit } from '@angular/core';

import { LocalStorageService } from '../../core/local-storage.service';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-pm',
  templateUrl: './pm.component.html',
  styleUrls: ['./pm.component.scss']
})
export class PmComponent implements OnInit {
  step = 1000;

  graphstyle = {
    position: 'absolute',
    top: '1vh',
    bottom: '3rem',
    left: '1vw',
    right: '1vw'
  };
  dataSeriesLabels = ['PM (µg/m³)'];
  startTime = '15m';

  constructor(
    private localStorage: LocalStorageService,
    private globalSettings: GlobalSettingsService
  ) {
    this.globalSettings.emitChange({ appName: 'Particulate Matter' }); // has to be here instead of ngOnInit, otherwise ExpressionChangedAfterItHasBeenCheckedError
  }

  ngOnInit() {
    const lsStep = this.localStorage.get('pm.step');
    if (lsStep) {
      this.step = lsStep;
    }
    const lsStartTime = this.localStorage.get('pm.start');
    if (lsStartTime) {
      this.startTime = lsStartTime;
    }
  }

  adjustTime(startTime: string, step: number) {
    this.startTime = startTime;
    this.step = step;
    this.localStorage.set('pm.step', step);
    this.localStorage.set('pm.start', startTime);
  }
}
