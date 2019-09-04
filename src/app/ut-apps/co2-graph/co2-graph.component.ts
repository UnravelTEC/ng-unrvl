import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { LocalStorageService } from '../../core/local-storage.service';

@Component({
  selector: 'app-co2-graph',
  templateUrl: './co2-graph.component.html',
  styleUrls: ['./co2-graph.component.css']
})
export class Co2GraphComponent implements OnInit, OnDestroy {
  public title = 'CO₂ Graph';
  step = 2000;

  extraDyGraphConfig = {
    strokeWidth: 1.0,
    logscale: true
  };
  labelBlackList = ['__name__', 'gas', 'featureset', 'serial'];

  backGroundLevels = [
    // the color acts for "everything below $value"
    [0.01, 'white'], // first one not used
    [415, 'rgba(0, 128, 0, 0.678)'], // green
    [600,'rgba(0, 128, 0, 0.35)'],
    [800, 'rgba(255, 255, 0, 0.35)'], // yellow
    [1200, 'rgba(255, 166, 0, 0.35)'], // orange
    [20000, 'rgba(255, 0, 0, 0.35)'] // red
  ];

  graphstyle = {
    position: 'absolute',
    top: '4em',
    bottom: '1vh',
    left: '1vw',
    right: '1vw'
  };
  dataSeriesLabels = ['SCD 30'];
  startTime = '15m';

  constructor(
    private localStorage: LocalStorageService,
    private globalSettings: GlobalSettingsService
  ) {
    // has to be here instead of ngOnInit, otherwise ExpressionChangedAfterItHasBeenCheckedError
    this.globalSettings.emitChange({ appName: this.title });
  }
  ngOnInit() {
    const lsStep = this.localStorage.get('pm.step');
    if (lsStep) {
      this.step = lsStep;
    }
    const lsStartTime = this.localStorage.get('co2.start');
    if (lsStartTime) {
      this.startTime = lsStartTime;
    }
  }
  ngOnDestroy() {
    console.log('CO2-App destroyed');
  }

  adjustTime(startTime: string, step: number) {
    this.startTime = startTime;
    this.step = step;
    this.localStorage.set('co2.step', step);
    this.localStorage.set('co2.start', startTime);
  }
}
