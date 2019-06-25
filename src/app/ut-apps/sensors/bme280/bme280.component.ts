import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';

@Component({
  selector: 'app-bme280',
  templateUrl: './bme280.component.html',
  styleUrls: ['./bme280.component.scss']
})
export class Bme280Component implements OnInit {

  graphstyle_T = {
    position: 'absolute',
    top: '3em',
    bottom: '70%',
    left: '1vw',
    right: '10em'
  };
  graphstyle_H = {
    position: 'absolute',
    top: '30%',
    bottom: '35%',
    left: '1vw',
    right: '10em'
  };
  graphstyle_P = {
    position: 'absolute',
    top: '65%',
    bottom: '0.5rem',
    left: '1vw',
    right: '10em'
  };

  dataSeriesLabels_T = ['BME280'];
  dataSeriesLabels_H = ['BME280'];
  dataSeriesLabels_P = ['BME280'];
  extraDyGraphConfig_T = { colors: [ 'red']};
  extraDyGraphConfig_H = { colors: [ 'blue']};
  extraDyGraphConfig_P = { colors: [ 'green']};
  labelBlackList = ['interval', 'sensor'];
  startTime = '15m';
  step = 1000;

  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'BME280' });
  }

  ngOnInit() {}
}
