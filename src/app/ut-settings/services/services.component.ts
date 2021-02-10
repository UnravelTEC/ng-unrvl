import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from 'app/core/local-storage.service';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

/* this is nearly a 1:1 copy of sensor services - maybe put code into own service? */

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
})
export class ServicesComponent implements OnInit {
  services = [];
  loading = true;
  loadingText = 'Initializing...';

  constructor(
    private utHTTP: UtFetchdataService,
    private localStorage: LocalStorageService,
    private globalSettings: GlobalSettingsService
  ) {
    this.globalSettings.emitChange({ appName: 'System Services' });
  }
  ngOnInit() {
    if (this.globalSettings.getAPIEndpoint()) {
      this.getServices();
    }
  }

  getServices() {
    this.utHTTP
      .getHTTPData(this.globalSettings.getAPIEndpoint() + 'system/services.php')
      .subscribe((data: Object) => this.acceptServices(data));
    this.loadingText = 'Loading...';
  }
  acceptServices(data: Object) {
    console.log('services:', data);
    if (data && data['services']) {
      this.services = data['services'];
    }
    this.loading = false;
  }

  startService(service: string) {
    console.log('starting', service);
    this.services.forEach((serviceItem) => {
      if (serviceItem['name'] == service) {
        serviceItem['running'] = undefined;
      }
    });
    this.sendCmd(service, 'start');
  }
  stopService(service: string) {
    console.log('stopping', service);
    this.services.forEach((serviceItem) => {
      if (serviceItem['name'] == service) {
        serviceItem['running'] = undefined;
      }
    });
    this.sendCmd(service, 'stop');
  }
  enableService(service: string) {
    console.log('enabling', service);
    this.services.forEach((serviceItem) => {
      if (serviceItem['name'] == service) {
        serviceItem['onboot'] = undefined;
      }
    });
    this.sendCmd(service, 'enable');
  }
  disableService(service: string) {
    console.log('disabling', service);
    this.services.forEach((serviceItem) => {
      if (serviceItem['name'] == service) {
        serviceItem['onboot'] = undefined;
      }
    });
    this.sendCmd(service, 'disable');
  }

  sendCmd(service: String, cmd: String) {
    this.utHTTP
      .getHTTPData(
        this.globalSettings.getAPIEndpoint() +
          'system/service.php?cmd=' +
          cmd +
          '&service=' +
          service,
        this.localStorage.get('api_user'),
        this.localStorage.get('api_pass'),
        true
      )
      .subscribe((data: Object) => this.checkSuccessOfCommand(data));
  }

  checkSuccessOfCommand(data: Object) {
    console.log('success:', data);
    if (!data['success']) {
      alert('last command unsuccessful');
    } else {
      this.getServices();
    }
  }
}
