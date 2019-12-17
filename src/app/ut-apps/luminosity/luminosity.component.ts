import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-luminosity',
  templateUrl: './luminosity.component.html',
  styleUrls: ['./luminosity.component.scss']
})
export class LuminosityComponent implements OnInit {
  step = 1000;

  extraDyGraphConfig = {
    strokeWidth: 1.0,
    logscale: true
  };
  labelBlackList = ['__name__', 'wavelength'];

  graphstyle = {
    position: 'absolute',
    top: '4em',
    bottom: '1vh',
    left: '1vw',
    right: '1vw'
  };
  startTime = '15m';
  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'Brightness' });
  }
  ngOnInit() {}
}
