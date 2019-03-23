import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-loudness',
  templateUrl: './loudness.component.html',
  styleUrls: ['./loudness.component.scss']
})
export class LoudnessComponent implements OnInit {
  graphstyle = {
    position: 'absolute',
    top: '1vh',
    bottom: '1vh',
    left: '1vw',
    right: '1vw'
  };

  dataSeriesLabels = ['Loudness'];
  startTime = '5m';

  constructor(private globalSettings: GlobalSettingsService) {
     // has to be here instead of ngOnInit, otherwise ExpressionChangedAfterItHasBeenCheckedError
    this.globalSettings.emitChange({ appName: 'Loudness' });
  }

  ngOnInit() {}
}
