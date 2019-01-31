import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-uv',
  templateUrl: './uv.component.html',
  styleUrls: ['./uv.component.scss']
})
export class UvComponent implements OnInit {
  graphstyle = {
    position: 'absolute',
    top: '4em',
    bottom: '3rem',
    left: '1vw',
    right: '1vw'
  };

  startTime = '3m';

  constructor(private globalSettings: GlobalSettingsService) { }

  ngOnInit() {
    this.globalSettings.emitChange({ appName: 'UV radiation' });
  }

}
