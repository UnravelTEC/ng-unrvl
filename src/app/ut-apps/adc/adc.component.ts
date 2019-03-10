import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-adc',
  templateUrl: './adc.component.html',
  styleUrls: ['./adc.component.scss']
})
export class AdcComponent implements OnInit {
  graphstyle = {
    position: 'absolute',
    top: '4em',
    bottom: '3rem',
    left: '1vw',
    right: '1vw'
  };
  dataSeriesLabels = ['ADS1*15'];
  startTime = '5m';

  constructor(private globalSettings: GlobalSettingsService) {
    // has to be here instead of ngOnInit, otherwise ExpressionChangedAfterItHasBeenCheckedError
    this.globalSettings.emitChange({ appName: 'ADC' });
  }

  ngOnInit() {}
}
