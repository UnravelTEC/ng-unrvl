import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../../core/local-storage.service';
import { HelperFunctionsService } from '../../core/helper-functions.service';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';
import { MqttService } from 'app/core/mqtt.service';
import { gitVersion } from 'environments/git-version';

@Component({
  selector: 'app-settings-panel',
  templateUrl: './settings-panel.component.html',
  styleUrls: ['./settings-panel.component.css'],
})
export class SettingsPanelComponent implements OnInit {
  defaultSettings = {
    server: {
      // settingsSection
      settingAttributes: {
        title: 'Backend Settings',
      },
      settings: {
        serverName: {
          fieldName: 'Endpoint Name',
          fieldValue: '',
        },
        serverHostName: {
          fieldName: 'Server hostname/ip',
          fieldValue: '',
        },
      },
    },
  };

  settingsArray = {
    newton: {
      server: {
        // settingsSection
        settingAttributes: {
          title: 'Backend Settings',
        },
        settings: {
          serverName: {
            fieldName: 'Endpoint Name',
            fieldValue: 'UnravelTEC Demo Server',
          },
          serverHostName: {
            fieldName: 'Server hostname/ip',
            fieldValue: 'newton.unraveltec.com',
          },
        },
      },
    },
    default: {
      // includes localhost
      server: {
        // settingsSection
        settingAttributes: {
          title: 'Backend Settings',
        },
        settings: {
          serverName: {
            fieldName: 'Endpoint Name',
            fieldValue: 'Default Host connection',
          },
          serverHostName: {
            fieldName: 'Server hostname/ip',
            fieldValue: '$baseurl',
          },
        },
      },
    },
  };
  endpointValue = undefined;

  globalSettings = {};
  localStoredSettings = false;
  globalSettingsUnsaved = {}; // the 'live' in editor ones the user can change before saving

  debug = true;
  gitV = gitVersion;

  public currentBrightness = 0;

  public oldIFPath = '';
  public uv4lPath = '';

  public API = '';

  constructor(
    private localStorage: LocalStorageService,
    public globalSettingsService: GlobalSettingsService,
    private utHTTP: UtFetchdataService,
    public h: HelperFunctionsService,
    private mqtt: MqttService
  ) {
    // has to be here instead of ngOnInit, otherwise ExpressionChangedAfterItHasBeenCheckedError
    this.globalSettingsService.emitChange({ appName: 'Settings' });
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
    this.API = this.globalSettingsService.getAPIEndpoint();

    if (this.API) {
      this.oldIFPath = this.API.replace(/api\/$/, '') + 'old/';
      this.uv4lPath = this.API.replace(/\/api\/$/, '') + ':8080';
    }
    console.log(
      'globalSettingsService.server',
      this.globalSettingsService.server
    );
    console.log('domain', this.h.domain);
    console.log('loc', window.location.href);
  }

  load() {
    const loadedSettings = this.localStorage.get('globalSettings'); // returns deep copy
    if (loadedSettings) {
      this.globalSettings = loadedSettings;
      this.globalSettingsUnsaved = this.localStorage.get('globalSettings');
      this.localStoredSettings = true;
    }
    console.log(
      'globalSettingsService.client.type',
      this.globalSettingsService.client.type
    );
  }

  // loadEndpoint() {
  //   if (!this.endpointValue) {
  //     alert('select an Endpoint');
  //     return;
  //   }
  //   const loadedSettings = this.settingsArray[this.endpointValue];
  //   console.log(loadedSettings);
  //   console.log(loadedSettings.server.settings.serverHostName.fieldValue);
  //   const serverUrl = this.h.getDeep(loadedSettings, [
  //     'server',
  //     'settings',
  //     'serverHostName',
  //     'fieldValue'
  //   ]);
  //   if (serverUrl == '$baseurl') {
  //     loadedSettings.server.settings.serverHostName.fieldValue = this.h.getBaseURL();
  //   }

  //   this.globalSettingsUnsaved = loadedSettings;

  //   this.localStorage.set('globalSettings', this.globalSettingsUnsaved);
  //   this.globalSettings = JSON.parse(
  //     JSON.stringify(this.globalSettingsUnsaved)
  //   );

  //   this.globalSettingsService.reloadSettings();
  //   this.localStoredSettings = true;
  // }

  save() {
    this.localStorage.set('globalSettings', this.globalSettingsUnsaved);
    this.globalSettings = JSON.parse(
      JSON.stringify(this.globalSettingsUnsaved)
    );
    // alert('save ok');
    this.globalSettingsService.reloadSettings();
    this.localStoredSettings = true;
    this.mqtt.reload();
  }
  reset() {
    this.globalSettingsUnsaved = JSON.parse(
      JSON.stringify(this.defaultSettings)
    );
    // alert('reset ok');
  }
  deleteStoredSettings() {
    this.localStorage.delete('globalSettings');
    this.globalSettingsService.reloadSettings();
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
        .getHTTPData(this.API + 'system/halt.php')
        .subscribe((data: Object) => this.ack(data));
    }
  }
  reboot() {
    if (confirm('Reboot now?')) {
      this.utHTTP
        .getHTTPData(this.API + 'system/reboot.php')
        .subscribe((data: Object) => this.ack(data));
    }
  }

  setNewBN(bn) {
    this.currentBrightness = bn;
  }
}
