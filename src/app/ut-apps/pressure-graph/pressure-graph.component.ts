import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-pressure-graph',
  templateUrl: './pressure-graph.component.html',
  styleUrls: ['./pressure-graph.component.scss']
})
export class PressureGraphComponent implements OnInit {

  graphstyle = {
    position: 'absolute',
    top: '3rem',
    bottom: '3rem',
    left: '5vw',
    right: '5vw'
  };
  dataSeriesLabels = ['Pressure'];
  startTime = '3h';

  constructor(private globalSettings: GlobalSettingsService) { }

  ngOnInit() {
    this.globalSettings.emitChange({ appName: 'Atmospheric Pressure' });
  }

}
