import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-r-ht',
  templateUrl: './r-ht.component.html',
  styleUrls: ['./r-ht.component.scss']
})
export class RHTComponent implements OnInit {
  fetchFromServerIntervalMS = 1000;

  graphstyleT = {
    position: 'absolute',
    top: '1.4em',
    bottom: '50%',
    left: '1vw',
    right: '1vw'
  };
  graphstyleH = {
    position: 'absolute',
    top: '50%',
    bottom: '0.5rem',
    left: '1vw',
    right: '1vw'
  };

  dataSeriesLabelsT = ['Temperature'];
  dataSeriesLabelsH = ['rel. Humidity'];
  startTime = '1h';

  constructor(private globalSettings: GlobalSettingsService) {
     // has to be here instead of ngOnInit, otherwise ExpressionChangedAfterItHasBeenCheckedError
    this.globalSettings.emitChange({ appName: 'rH / T' });
  }

  ngOnInit() {}
}
