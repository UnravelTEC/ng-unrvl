import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { LocalStorageService } from '../../core/local-storage.service';
import { HelperFunctionsService } from '../../core/helper-functions.service';

@Component({
  selector: 'app-gamma',
  templateUrl: './gamma.component.html',
  styleUrls: ['./gamma.component.scss']
})
export class GammaComponent implements OnInit {
  startTime = '24h';
  step = 10000;
  dataSeriesLabels = ['RS 04'];
  multiplicateFactors = [1000000000, 1000000000, 1000000000];
  runningAvgPoints = 0;

  graphstyle = {
    position: 'absolute',
    top: '4em',
    bottom: '1vh',
    left: '1vw',
    right: '1vw'
  };

  labelBlackList = ['__name__', 'job'];

  constructor(
    private globalSettings: GlobalSettingsService,
    private h: HelperFunctionsService,
    private localStorage: LocalStorageService
  ) {
     // has to be here instead of ngOnInit, otherwise ExpressionChangedAfterItHasBeenCheckedError
    this.globalSettings.emitChange({ appName: 'Radioactivity Demo' });
  }

  ngOnInit() {
    const lsStep = this.localStorage.get('gamma.step');
    if (lsStep) {
      this.step = lsStep;
    }
    const lsStartTime = this.localStorage.get('gamma.start');
    if (lsStartTime) {
      this.startTime = lsStartTime;
    }
    const lsRunningAvgPoints = this.localStorage.get(
      'gamma.runningAvgPoints'
    );
    if (lsRunningAvgPoints) {
      this.runningAvgPoints = lsRunningAvgPoints;
    }
  }

  adjustTime(startTime: string, step: number) {
    this.startTime = startTime;
    this.step = step;
    this.localStorage.set('gamma.step', step);
    this.localStorage.set('gamma.start', startTime);
    this.localStorage.set('gamma.runningAvgPoints', this.runningAvgPoints);
  }
  save() {
    this.step = 10000;
    let seconds = this.h.parseToSeconds(this.startTime);
    while (seconds > 10000) {
      this.step = this.step * 10;
      seconds = seconds / 10;
    }
    this.localStorage.set('gamma.step', this.step);
    this.localStorage.set('gamma.start', this.startTime);
    this.localStorage.set('gamma.runningAvgPoints', this.runningAvgPoints);
  }
}
