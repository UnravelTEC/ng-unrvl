import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../../core/local-storage.service';

@Component({
  selector: 'app-settings-panel',
  templateUrl: './settings-panel.component.html',
  styleUrls: ['./settings-panel.component.css']
})
export class SettingsPanelComponent implements OnInit {
  defaultSettings = {
    server: {
      // settingsSection
      settingAttributes: {
        title: 'Server Settings'
      },
      settings: {
        serverHostName: { fieldName: 'Server Host Name', fieldValue: 'scpexploratory02.tugraz.at' }, // entry
        serverPort: { fieldName: 'Server Port', fieldValue: '443' }, // 9090
        serverPath: { fieldName: 'Server Path', fieldValue: 'prometheus/api/v1/' } // -prom
      }
    }
  };

  globalSettings = {};
  globalSettingsUnsaved = {}; // the 'live' in editor ones the user can change before saving

  debug = true;

  constructor(private localStorage: LocalStorageService) {}

  ngOnInit() {
    // before, read out all localstorage items
    this.load();

    for (let item in this.defaultSettings) {
      if (!this.globalSettingsUnsaved[item]) {
        let deepcopy = JSON.stringify(this.defaultSettings[item]);
        this.globalSettingsUnsaved[item] = JSON.parse(deepcopy);
      }
    }
  }

  load() {
    const loadedSettings = this.localStorage.get('globalSettings'); //returns deep copy
    if(loadedSettings) {
      this.globalSettings = loadedSettings;
      this.globalSettingsUnsaved = this.localStorage.get('globalSettings');
    }
  }

  save() {
    this.localStorage.set('globalSettings', this.globalSettingsUnsaved);
    this.globalSettings = JSON.parse(JSON.stringify(this.globalSettingsUnsaved));
    // alert('save ok');
  }
  reset() {
    this.globalSettingsUnsaved = JSON.parse(JSON.stringify(this.defaultSettings));
    // alert('reset ok');
  }
}
