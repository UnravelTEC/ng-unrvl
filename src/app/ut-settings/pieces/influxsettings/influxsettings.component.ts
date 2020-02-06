import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';

@Component({
  selector: 'app-influxsettings',
  templateUrl: './influxsettings.component.html',
  styleUrls: ['./influxsettings.component.scss']
})
export class InfluxsettingsComponent implements OnInit, OnDestroy {
  dbname = '';
  username = '';
  password = '';
  constructor(public gss: GlobalSettingsService, private localStorage: LocalStorageService) {}

  ngOnInit() {}

  ngOnDestroy() {
    this.saveSettings();
  }
  saveSettings() {
    this.localStorage.set('influxdb', this.gss.server.influxdb);
    this.localStorage.set('influxuser', this.gss.server.influxuser);
    this.localStorage.set('influxpass', this.gss.server.influxpass);
  }
}
