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
    top: '1vh',
    bottom: '1vh',
    left: '1vw',
    right: '10rem'
  };
  dataSeriesLabels = ['ADS1*15'];
  labelBlackList = ['__name__', 'model','sensor','interval']; //'sensor',,'id'
  startTime = '5m';

  extraDyGraphConfig = {
    logscale: true
  };

  constructor(private globalSettings: GlobalSettingsService) {
    // has to be here instead of ngOnInit, otherwise ExpressionChangedAfterItHasBeenCheckedError
    this.globalSettings.emitChange({ appName: 'ADC' });
  }

  ngOnInit() {}
}
