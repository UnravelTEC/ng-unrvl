import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';

@Component({
  selector: 'app-vif',
  templateUrl: './vif.component.html',
  styleUrls: ['./vif.component.scss']
})
export class VifComponent implements OnInit {

  step = 1000;

  extraDyGraphConfig = {
    strokeWidth: 1.0,
    logscale: true
  };

  graphstyle = {
    position: 'absolute',
    top: '1vh',
    bottom: '3rem',
    left: '1vw',
    right: '1vw'
  };
  startTime = '15m';

  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'vif' });
   }

  ngOnInit() {
  }

}
