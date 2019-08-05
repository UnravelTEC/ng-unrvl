import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-adc-diff',
  templateUrl: './adc-diff.component.html',
  styleUrls: ['./adc-diff.component.scss']
})
export class AdcDiffComponent implements OnInit {
  graphstyle = {
    position: 'absolute',
    top: '1vh',
    bottom: '1vh',
    left: '1vw',
    right: '10rem'
  };
  dataSeriesLabels = ['ADS1*15'];
  startTime = '3m';
  multiplicateFactors = [1000,1000];

  constructor(private globalSettings: GlobalSettingsService) {
    // has to be here instead of ngOnInit, otherwise ExpressionChangedAfterItHasBeenCheckedError
    this.globalSettings.emitChange({ appName: 'ADC-Diff' });
  }

  ngOnInit() {}
}
