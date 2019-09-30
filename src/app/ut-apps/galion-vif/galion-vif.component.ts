import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-galion-vif',
  templateUrl: './galion-vif.component.html',
  styleUrls: ['./galion-vif.component.scss']
})
export class GalionVifComponent implements OnInit {
  public title = 'Galion VIF';

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

  labelBlackList = ['interval', 'adc'];

  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({
      appName: this.title
    });
   }

  ngOnInit() {
  }

}
