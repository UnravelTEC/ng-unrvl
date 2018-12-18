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
    top: '3rem',
    bottom: '49vh',
    left: '5vw',
    right: '5vw'
  };
  graphstyleH = {
    position: 'absolute',
    top: '51vh',
    bottom: '3rem',
    left: '5vw',
    right: '5vw'
  };

  dataSeriesLabelsT = ['Temperature'];
  dataSeriesLabelsH = ['rel. Humidity'];
  startTime = '1h';

  constructor(private globalSettings: GlobalSettingsService) { }

  ngOnInit() {
    this.globalSettings.emitChange({ appName: 'rH / T' });
  }

}
