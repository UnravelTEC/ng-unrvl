import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../../core/local-storage.service';

@Component({
  selector: 'app-settings-panel',
  templateUrl: './settings-panel.component.html',
  styleUrls: ['./settings-panel.component.css']
})
export class SettingsPanelComponent implements OnInit {
  defaultSettings = {
    server: { // settingsSection
      settingAttributes: {
        title: 'Server Settings'
      },
      settings: {
        serverHostName: { fieldName: 'Server Host Name', fieldValue: '' }, // entry
        serverPort: { fieldName: 'Server Port', fieldValue: '9090' },
        serverPath: { fieldName: 'Server Path', fieldValue: '/api/v1/' }
      }
    }
  };

  globalSettings = {};

  debug = true;

  constructor(private localStorage: LocalStorageService) {}

  ngOnInit() {
    // before, read out all localstorage items

    for (let item in this.defaultSettings) {
      if (!this.globalSettings[item]) {
        let deepcopy = JSON.stringify(this.defaultSettings[item]);
        this.globalSettings[item] = JSON.parse(deepcopy);
      }
    }
  }
}
