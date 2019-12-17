import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';

@Component({
  selector: 'app-sgas',
  templateUrl: './sgas.component.html',
  styleUrls: ['./sgas.component.scss']
})
export class SgasComponent implements OnInit {
  labelBlackList = ['__name__', 'job', 'interval', 'adc'];

  graphstyle = {
    position: 'absolute',
    top: '3.5em',
    bottom: '1vh',
    left: '1vw',
    right: '1vw'
  };
  startTime = '15m';
  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'IDT SGAS' });
  }

  ngOnInit() {
  }

}
