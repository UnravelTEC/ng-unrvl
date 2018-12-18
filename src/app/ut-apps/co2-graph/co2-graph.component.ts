import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-co2-graph',
  templateUrl: './co2-graph.component.html',
  styleUrls: ['./co2-graph.component.css']
})
export class Co2GraphComponent implements OnInit {
  public title = 'CO₂ Graph';

  constructor(private globalSettings: GlobalSettingsService) {}
  ngOnInit() {
    this.globalSettings.emitChange({ appName: this.title });
  }

  graphstyle = {
    position: 'absolute',
    top: '3rem',
    bottom: '3rem',
    left: '5vw',
    right: '5vw'
  };
  dataSeriesLabels = ['CO₂'];
  startTime = '15m';
}
