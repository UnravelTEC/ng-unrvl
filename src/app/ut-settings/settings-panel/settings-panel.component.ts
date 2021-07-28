import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../../core/local-storage.service';
import { HelperFunctionsService } from '../../core/helper-functions.service';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';
import { MqttService } from '../../core/mqtt.service';
import { gitVersion } from '../../../environments/git-version';

@Component({
  selector: 'app-settings-panel',
  templateUrl: './settings-panel.component.html',
  styleUrls: ['./settings-panel.component.scss'],
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

  public api_username = 'system';
  public api_pass = '';
  public login_status_text = 'Not logged in.';
  public auth = 'NOK';

  public backendTypes = [ "Internet server", "Current Device", "Local Device" ];
  public chosenBackendType = "Internet server";

  public InternetServers = {
    Newton: { }
  }

  /*
  Cases:
    - dev (localhost:4200)
    - Local Screen (localhost)
    - internet server (https://...)
    - LAN (http://...)

  Defaults (if nothing in LS):
    - if dev -> Newton, influx public
    - everything else -> baseurl, influx telegraf

  needed saved Settings:
    - baseurl
    - influx db, user, pass (sub-app accesses gss directly!)


  Check at start
    - isDev
    - hasLocalScreen
    - hasFan
    - show Login?
    - has network settings (->startswith http://)
    - show influx settings (isDev, Internet Server)

  Settings Sections
    - Backend
    - Auth
    - Brightness
    - Network
    - Fan Speed
    - System Services
    - System Time
    - Shut Down/Reboot
    - Influx
  -> New
  - Backend
    - Influx
  - If Auth
    - Network
    - Brightness, Fan Speed, System Time
    - System Services, Shut Down/Reboot

    */
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

    this.login();
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
    const ls_api_user = this.localStorage.get('api_user');
    if (ls_api_user) this.api_username = ls_api_user;
    const ls_api_pass = this.localStorage.get('api_pass');
    if (ls_api_pass) this.api_pass = ls_api_pass;
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
    this.API = this.globalSettingsService.getAPIEndpoint();
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

  login() {
    this.login_status_text = 'authentication Request sent.';
    this.localStorage.set('api_user', this.api_username);
    this.localStorage.set('api_pass', this.api_pass);

    this.utHTTP
      .getHTTPData(
        this.API + 'system/auth.php',
        this.api_username,
        this.api_pass,
        true
      )
      .subscribe(
        (data: Object) => this.acceptAuth(data),
        (error: any) => this.handleAuthError(error)
      );
  }
  acceptAuth(data: Object) {
    if (data['success'] && data['success'] === true) {
      this.login_status_text = 'Authentication successful';
      this.auth = 'OK';
    } else {
      this.login_status_text = 'error at authentication';
      this.auth = 'NOK';
    }
    console.log('acceptAuth', data);
  }
  handleAuthError(error: any) {
    this.login_status_text = 'authentication failed';
    if (error && error['statusText']) {
      this.login_status_text += ': ' + error['statusText'];
      // 500 if no htpasswd file there
    }
    this.auth = 'NOK';
    console.log('auth error', error);
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
        .getHTTPData(
          this.API + 'system/halt.php',
          this.api_username,
          this.api_pass,
          true
        )
        .subscribe((data: Object) => this.ack(data));
    }
  }
  reboot() {
    if (confirm('Reboot now?')) {
      this.utHTTP
        .getHTTPData(
          this.API + 'system/reboot.php',
          this.api_username,
          this.api_pass,
          true
        )
        .subscribe((data: Object) => this.ack(data));
    }
  }

  setNewBN(bn) {
    this.currentBrightness = bn;
  }
}
