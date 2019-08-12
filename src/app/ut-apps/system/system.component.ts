import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-system',
  templateUrl: './system.component.html',
  styleUrls: ['./system.component.scss']
})
export class SystemComponent implements OnInit {
  graphstyle = {
    position: 'absolute',
    top: '0',
    bottom: '0',
    left: '0',
    right: '0'
  };

  startTime = '15m';
  labelBlackList = ['__name__', 'gas'];
  dataSeriesLabels = ['DGS-O3968-042'];

  labelBlackListMem = ['interval'];

  multiplicateFactorsMem = [1 / 1000000, 1 / 1000000, 1 / 1000000];
  multiplicateFactorsCPU = [1 / 1000000];

  extraDyGraphConfigMem = {
    stackedGraph: true //,
    // logscale: true
  };

  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'system' });
  }

  ngOnInit() {}
}
