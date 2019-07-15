import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';

@Component({
  selector: 'app-mics6814',
  templateUrl: './mics6814.component.html',
  styleUrls: ['./mics6814.component.scss']
})
export class Mics6814Component implements OnInit {
  step = '1000';
  extraDyGraphConfig = {
    strokeWidth: 1.5 //,
    // logscale: true
  };
  labelBlackList = ['__name__', 'interval'];
  startTime = '15m';

  graphstyle_red = {
    position: 'absolute',
    top: '0',
    bottom: '67%',
    left: '1vw',
    right: '10em'
  };
  graphstyle_ox = {
    position: 'absolute',
    top: '34%',
    bottom: '34%',
    left: '1vw',
    right: '10em'
  };
  graphstyle_ammo = {
    position: 'absolute',
    top: '66%',
    bottom: '0.5rem',
    left: '1vw',
    right: '10em'
  };
  dataSeriesLabelRed = ['Reducing'];
  dataSeriesLabelOx = ['Oxidizing'];
  dataSeriesLabelAmmo = ['Ammonia'];

  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'MiCS 6814 Gas Sensor' });
  }

  ngOnInit() {}
}
