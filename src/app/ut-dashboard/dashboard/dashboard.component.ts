import { Component, OnInit } from '@angular/core';

import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(private globalSettings: GlobalSettingsService) { }

  ngOnInit() {
    this.globalSettings.emitChange({ appName: 'Dashboard' });
  }

}
