import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { LocalStorageService } from '../../core/local-storage.service';

@Component({
  selector: 'app-co2',
  templateUrl: './co2.component.html',
  styleUrls: ['./co2.component.css']
})
export class Co2Component implements OnInit, OnDestroy {
  public title = 'CO₂';
  step = 2000;

  extraDyGraphConfig = {
    strokeWidth: 2.0,
    width: '420', // - margin-left
    height: '200',
    legend: 'never'
  };

  graphstyleo = {
    position: 'absolute',
    top: '430px',
    bottom: '3rem',
    left: '10vw',
    right: '10vw'
  };
  graphstyle = {
    position: 'relative'
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
