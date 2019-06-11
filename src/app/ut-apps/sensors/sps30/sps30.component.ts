import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';

@Component({
  selector: 'app-sps30',
  templateUrl: './sps30.component.html',
  styleUrls: ['./sps30.component.scss']
})
export class Sps30Component implements OnInit {
  public title = 'Sensirion SPS30';
  step = 2000;

  extraDyGraphConfig = {
    strokeWidth: 2.0 //,
    // logscale: true
  };

  graphstyle_ugpm3 = {
    position: 'absolute',
    top: '3em',
    bottom: '70%',
    left: '1vw',
    right: '10em'
  };
  graphstyle_ppcm3 = {
    position: 'absolute',
    top: '30%',
    bottom: '35%',
    left: '1vw',
    right: '10em'
  };
  graphstyle_typpartsize = {
    position: 'absolute',
    top: '65%',
    bottom: '0.5rem',
    left: '1vw',
    right: '10em'
  };
  dataSeriesLabels = ['SPS30'];
  startTime = '15m';

  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'SPS30' });
  }
  ngOnInit() {}
}
