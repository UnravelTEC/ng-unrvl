import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';

@Component({
  selector: 'app-scd30',
  templateUrl: './scd30.component.html',
  styleUrls: ['./scd30.component.scss']
})
export class Scd30Component implements OnInit {
  public title = 'Sensirion SCD30';
  step = 2000;

  extraDyGraphConfig = {
    strokeWidth: 2.0 //,
    // logscale: true
  };

  labelBlackList = ['sensor', '__name__', 'gas'];
  labelBlackListHT = ['sensor'];

  graphstyleCO2 = {
    position: 'absolute',
    top: '3em',
    bottom: '50%',
    left: '1vw',
    right: '8em'
  };
  graphstyleTH = {
    position: 'absolute',
    top: '50%',
    bottom: '0.5rem',
    left: '1vw',
    right: '8em'
  };
  dataSeriesLabels = ['SCD 30'];
  dataSeriesLabelsTH = ['SCD 30'];
  startTime = '15m';

  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'SCD30' });
  }

  ngOnInit() {}
}
