import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';

@Component({
  selector: 'app-temperatures',
  templateUrl: './temperatures.component.html',
  styleUrls: ['./temperatures.component.scss']
})
export class TemperaturesComponent implements OnInit {
  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'temperatures' });
  }

  ngOnInit() {}
}
