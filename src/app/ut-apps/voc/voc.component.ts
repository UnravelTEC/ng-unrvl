import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-voc',
  templateUrl: './voc.component.html',
  styleUrls: ['./voc.component.scss']
})
export class VocComponent implements OnInit {
  graphstyle = {
    position: 'absolute',
    top: '4em',
    bottom: '3rem',
    left: '1vw',
    right: '1vw'
  };

  startTime = '15m';

  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'VOC' });
   }

  ngOnInit() {
  }

}
