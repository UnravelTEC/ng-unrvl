import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-galion',
  templateUrl: './galion.component.html',
  styleUrls: ['./galion.component.scss']
})
export class GalionComponent implements OnInit {
  public title = 'Galion Testbed';
  step = 1000;
  graphstyle = {
    position: 'absolute',
    top: '0',
    bottom: '0rem',
    left: '1rem',
    right: '1rem'
  };

  graphstyle_scd30 = this.graphstyle;
  graphstyle_sgp30 = this.graphstyle;
  graphstyle_dgs = this.graphstyle;
  graphstyle_adc1 = this.graphstyle;
  graphstyle_adc2 = this.graphstyle;
  options = false;

  graphstyle_p = {
    position: 'absolute',
    top: '0',
    bottom: '50%',
    left: '1rem',
    right: '1rem'
  };
  graphstyle_HT = {
    position: 'absolute',
    top: '50%',
    bottom: '0',
    left: '1rem',
    right: '1rem'
  };

  multiplicateFactorsVOC = [1000];

  extraDyGraphConfig = {
    strokeWidth: 2.0 //,
    // logscale: true
  };

  dataSeriesLabels = ['Galion'];
  labelBlackList = ['__name__', 'interval', 'featureset', 'serial','id','adc'];
  labelBlackListHT = ['interval', 'sensor', 'featureset', 'serial','id'];
  startTime = '15m';

  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({
      appName: this.title
    });
  }
  ngOnInit() {}
}
