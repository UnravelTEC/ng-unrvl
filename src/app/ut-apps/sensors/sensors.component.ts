import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

/* this is nearly a 1:1 copy of system services - maybe put code into own service? */

@Component({
  selector: 'app-sensors',
  templateUrl: './sensors.component.html',
  styleUrls: ['./sensors.component.scss']
})
export class SensorsComponent implements OnInit {
  services = [];
  loading = true;
  loadingText = 'Initializing...';

  implemented_sensors = ['sps30', 'scd30', 'ds18b20','bme280','type5'];

  constructor(
    private globalSettings: GlobalSettingsService,
    private utHTTP: UtFetchdataService
  ) {
    this.globalSettings.emitChange({ appName: 'Sensors Overview' });
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
      data['services'].forEach(item => {
        item.UpperCaseName = item.name.toUpperCase();
        if (item['sensor']) {
          console.log(item);
          if(this.implemented_sensors.indexOf(item.name) !== -1) {
            item.implemented = true;
          }
          this.services.push(item);
        }
      });
    }

    this.loading = false;
  }

  startService(service: string) {
    console.log('starting', service);
    this.services.forEach(serviceItem => {
      if (serviceItem['name'] == service) {
        serviceItem['running'] = undefined;
      }
    });
    this.sendCmd(service, 'start');
  }
  stopService(service: string) {
    console.log('stopping', service);
    this.services.forEach(serviceItem => {
      if (serviceItem['name'] == service) {
        serviceItem['running'] = undefined;
      }
    });
    this.sendCmd(service, 'stop');
  }
  enableService(service: string) {
    console.log('enabling', service);
    this.services.forEach(serviceItem => {
      if (serviceItem['name'] == service) {
        serviceItem['onboot'] = undefined;
      }
    });
    this.sendCmd(service, 'enable');
  }
  disableService(service: string) {
    console.log('disabling', service);
    this.services.forEach(serviceItem => {
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
          service
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
