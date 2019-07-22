import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';

@Component({
  selector: 'app-sgp30',
  templateUrl: './sgp30.component.html',
  styleUrls: ['./sgp30.component.scss']
})
export class Sgp30Component implements OnInit {
  public title = 'Sensirion SGP30: Multi-Pixel Gas Sensor';
  step = 1000;
  graphstyle = {
    position: 'absolute',
    top: '0',
    bottom: '2em',
    left: '1rem',
    right: '1rem'
  };
  graphstyle_co2 = this.graphstyle;
  graphstyle_co2_base = this.graphstyle;
  graphstyle_h2_raw =  this.graphstyle;
  graphstyle_voc =  this.graphstyle;
  graphstyle_voc_base =  this.graphstyle;
  graphstyle_voc_raw =  this.graphstyle;
  options = false;


  extraDyGraphConfig = {
    strokeWidth: 2.0 //,
    // logscale: true
  };

  dataSeriesLabels = ['SGP30'];
  labelBlackList = ['__name__', 'interval', 'sensor','featureset','serial'];
  startTime = '15m';

  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({
      appName: this.title
    });
  }
  ngOnInit() {}
}
