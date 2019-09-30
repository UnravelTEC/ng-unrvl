import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';

@Component({
  selector: 'app-tgs5141',
  templateUrl: './tgs5141.component.html',
  styleUrls: ['./tgs5141.component.scss']
})
export class Tgs5141Component implements OnInit {
  labelBlackList = ['__name__', 'job', 'interval'];

  graphstyle = {
    position: 'absolute',
    top: '3.5em',
    bottom: '1vh',
    left: '1vw',
    right: '1vw'
  };
  dataSeriesLabels = ['Temperature'];
  startTime = '15m';

  constructor (private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'TGS5141' }); }

  ngOnInit() {
  }

}
