import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-ies',
  templateUrl: './ies.component.html',
  styleUrls: ['./ies.component.scss']
})
export class IesComponent implements OnInit {
  graphstyle = {
    position: 'absolute',
    top: '1rem',
    bottom: '1rem',
    left: '1vw',
    right: '30em'
  };

  extraDyGraphConfig = {

    logscale: true
  };

  startTime = '15m';

  labelBlackList = ['interval'];

  constructor (private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'Galion-IES' }); }
  ngOnInit() {
  }

}
