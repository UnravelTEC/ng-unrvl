import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';

@Component({
  selector: 'app-type5',
  templateUrl: './type5.component.html',
  styleUrls: ['./type5.component.scss']
})
export class Type5Component implements OnInit {

  step = 1000;
  dataSeriesLabelsSvph = ['Type 5']
  startTime = '5h';
  multiplicateFactors = [1000000000];

  graphstyleTop = {
    position: 'absolute',
    top: '3em',
    bottom: '50%',
    left: '1vw',
    right: '10rem'
  };
  graphstyleBottom = {
    position: 'absolute',
    top: '50%',
    bottom: '0.5rem',
    left: '1vw',
    right: '10rem'
  };
  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'Type 5 Radiation Sensor' });
  }
  ngOnInit() {}
}
