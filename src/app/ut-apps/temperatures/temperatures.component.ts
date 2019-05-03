import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';

@Component({
  selector: 'app-temperatures',
  templateUrl: './temperatures.component.html',
  styleUrls: ['./temperatures.component.scss']
})
export class TemperaturesComponent implements OnInit {
  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'Temperatures Overview' });
  }

  fetchFromServerIntervalMS = 1000;

  graphstyle = {
    position: 'absolute',
    top: '1vh',
    bottom: '1vh',
    left: '1vw',
    right: '1vw'
  };
  dataSeriesLabels = ['Temperature'];
  startTime = '15m';

  ngOnInit() {}
}
