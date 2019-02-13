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
    strokeWidth: 3.0
  };

  graphstyle = {
    position: 'absolute',
    top: '4em',
    bottom: '3rem',
    left: '1vw',
    right: '1vw'
  };
  dataSeriesLabels = ['SCD 30'];
  startTime = '15m';

  constructor(
    private localStorage: LocalStorageService,
    private globalSettings: GlobalSettingsService
  ) {
    this.globalSettings.emitChange({ appName: this.title }); // has to be here instead of ngOnInit, otherwise ExpressionChangedAfterItHasBeenCheckedError
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
