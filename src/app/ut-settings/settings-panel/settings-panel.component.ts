import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../../core/local-storage.service';
import { HelperFunctionsService } from '../../core/helper-functions.service';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

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
        serverHostName: {
          fieldName: 'Server Host Name',
          fieldValue: 'scpexploratory02.tugraz.at'
        }, // entry
        serverPort: { fieldName: 'Server Port', fieldValue: '443' }, // 9090
        serverPath: {
          fieldName: 'Server Path',
          fieldValue: 'prometheus/api/v1/'
        } // -prom
      }
    }
  };

  globalSettings = {};
  globalSettingsUnsaved = {}; // the 'live' in editor ones the user can change before saving

  debug = true;

  public ourHostName: string;
  public currentBrightness = 0;

  constructor(
    private localStorage: LocalStorageService,
    private h: HelperFunctionsService,
    private globalSettingsService: GlobalSettingsService,
    private utHTTP: UtFetchdataService
  ) {
    this.globalSettingsService.emitChange({ appName: 'Settings' }); // has to be here instead of ngOnInit, otherwise ExpressionChangedAfterItHasBeenCheckedError
  }

  ngOnInit() {
    // before, read out all localstorage items
    this.load();

    for (const item in this.defaultSettings) {
      if (!this.globalSettingsUnsaved[item]) {
        const deepcopy = JSON.stringify(this.defaultSettings[item]);
        this.globalSettingsUnsaved[item] = JSON.parse(deepcopy);
      }
    }

    this.ourHostName = this.h.getBaseURL();
  }

  load() {
    const loadedSettings = this.localStorage.get('globalSettings'); // returns deep copy
    if (loadedSettings) {
      this.globalSettings = loadedSettings;
      this.globalSettingsUnsaved = this.localStorage.get('globalSettings');
    }
  }

  save() {
    this.localStorage.set('globalSettings', this.globalSettingsUnsaved);
    this.globalSettings = JSON.parse(
      JSON.stringify(this.globalSettingsUnsaved)
    );
    // alert('save ok');
  }
  reset() {
    this.globalSettingsUnsaved = JSON.parse(
      JSON.stringify(this.defaultSettings)
    );
    // alert('reset ok');
  }

  fullscreen() {
    // https://stackoverflow.com/questions/36672561/how-to-exit-fullscreen-onclick-using-javascript
    const isInFullScreen =
      document['fullscreenElement'] && document['fullscreenElement'] !== null;
    /*||
        (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
        (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
        (document.msFullscreenElement && document.msFullscreenElement !== null); */

    const docElm = document.documentElement;
    if (!isInFullScreen) {
      if (docElm.requestFullscreen) {
        docElm.requestFullscreen();
      } /* else if (docElm.mozRequestFullScreen) {
            docElm.mozRequestFullScreen();
        } else if (docElm.webkitRequestFullScreen) {
            docElm.webkitRequestFullScreen();
        } else if (docElm.msRequestFullscreen) {
            docElm.msRequestFullscreen();
        } */
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } /* else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } */
    }
  }

  ack(data: Object) {
    console.log('api retval:', data);
    if (data['shutdown']) {
      switch (data['shutdown']) {
        case 'halt':
          alert('system halted');
          break;
        case 'reboot':
          alert('system rebooted');
          break;
      }
    }
  }

  halt() {
    if (confirm('Halt now?')) {
      this.utHTTP
        .getHTTPData(this.getServer() + 'system/halt.php')
        .subscribe((data: Object) => this.ack(data));
    }
  }
  reboot() {
    if (confirm('Reboot now?')) {
      this.utHTTP
        .getHTTPData(this.getServer() + 'system/reboot.php')
        .subscribe((data: Object) => this.ack(data));
    }
  }

  getServer(): string {
    let server = this.h.getDeep(this.globalSettings, [
      'server',
      'settings',
      'serverHostName',
      'fieldValue'
    ]);
    if (!server) {
      return this.ourHostName + '/api/';
    }
    return 'http://' + server + '/api/';
  }
  setNewBN(bn) {
    this.currentBrightness = bn;
  }
}
