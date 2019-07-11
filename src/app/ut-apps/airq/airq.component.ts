import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-airq',
  templateUrl: './airq.component.html',
  styleUrls: ['./airq.component.scss']
})
export class AirqComponent implements OnInit {
  stepCO2 = 2000;
  stepPM = 1000;
  startTime = '15m';

  extraDyGraphConfigCO2 = {
    strokeWidth: 2.0,
    pointSize: 1,
    highlightSeriesOpts: {
      strokeWidth: 2,
      strokeBorderWidth: 2,
      highlightCircleSize: 2
    },
    legend: 'never',
    width: '200'
  };

  graphstyleCO2 = {
    position: 'absolute',
    top: '250px',
    bottom: '1rem',
    left: '-20px',
  };
  graphstylePM = {
    position: 'absolute',
    top: '250px',
    bottom: '1rem',
    left: '180px',
  };
  graphstyleVOC = {
    position: 'absolute',
    top: '250px',
    bottom: '1rem',
    left: '380px',
  };
  graphstyleT = {
    position: 'absolute',
    top: '250px',
    bottom: '25%',
    left: '580px',
  };
  graphstylerH = {
    position: 'absolute',
    top: '75%',
    bottom: '1rem',
    left: '580px',
  };

  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'Air Quality' });
  }
  ngOnInit() {}
}
