import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';

@Component({
  selector: 'app-ds18b20',
  templateUrl: './ds18b20.component.html',
  styleUrls: ['./ds18b20.component.scss']
})
export class Ds18b20Component implements OnInit {
  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'DS18B20' });
  }

  ngOnInit() {}

  fetchFromServerIntervalMS = 1000;

  labelBlackList = ['__name__', 'job'];

  graphstyle = {
    position: 'absolute',
    top: '3.5em',
    bottom: '1vh',
    left: '1vw',
    right: '1vw'
  };
  dataSeriesLabels = ['Temperature'];
  startTime = '15m';
}
