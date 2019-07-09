import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-ozone',
  templateUrl: './ozone.component.html',
  styleUrls: ['./ozone.component.scss']
})
export class OzoneComponent implements OnInit {
  step = 1000;
  extraDyGraphConfig = {
    strokeWidth: 3.0,
    logscale: false
  };
  graphstyle = {
    position: 'absolute',
    top: '4em',
    bottom: '2em',
    left: '1vw',
    right: '1vw'
  };
  startTime = '15m';
  labelBlackList = ['__name__', 'gas'];
  dataSeriesLabels = ['DGS-O3968-042'];

  multiplicateFactors = [1000];

  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'Ozone Level' });
  }
  ngOnInit() {}
}
