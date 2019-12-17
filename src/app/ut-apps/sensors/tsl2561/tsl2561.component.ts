import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';

@Component({
  selector: 'app-tsl2561',
  templateUrl: './tsl2561.component.html',
  styleUrls: ['./tsl2561.component.scss']
})
export class Tsl2561Component implements OnInit {
  labelBlackList = ['__name__', 'interval', 'sensor'];
  startTime = '15m';
  step = 1000;
  graphstyle = {
    position: 'absolute',
    top: '1vh',
    bottom: '1vh',
    left: '1vw',
    right: '1vw'
  };
  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'TSL2561 Brightness' });
  }
  ngOnInit() {}
}
