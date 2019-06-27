import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-pressure-graph',
  templateUrl: './pressure-graph.component.html',
  styleUrls: ['./pressure-graph.component.scss']
})
export class PressureGraphComponent implements OnInit {
  fetchFromServerIntervalMS = 1000;

  graphstyle = {
    position: 'absolute',
    top: '1vh',
    bottom: '3em',
    left: '1vw',
    right: '1vw'
  };
  dataSeriesLabels = ['Pressure'];
  startTime = '3h';

  labelBlackList = ['__name__', 'job'];

  constructor(private globalSettings: GlobalSettingsService) {
     // has to be here instead of ngOnInit, otherwise ExpressionChangedAfterItHasBeenCheckedError
    this.globalSettings.emitChange({ appName: 'Atmospheric Pressure' });
  }

  ngOnInit() {}
}
