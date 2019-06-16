import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent implements OnInit {
  services = [];

  constructor(
    private utHTTP: UtFetchdataService,
    private globalSettings: GlobalSettingsService
  ) {
    this.globalSettings.emitChange({ appName: 'services' });
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
  }
  acceptServices(data: Object) {
    // console.log('services:', data);
    if (data && data['services']) {
      this.services = data['services'];
    }
  }

  startService(service: String) {
    console.log('starting', service);
    this.sendCmd(service, 'start');
  }
  stopService(service: String) {
    console.log('stopping', service);
    this.sendCmd(service, 'stop');
  }
  enableService(service: String) {
    console.log('enabling', service);
    this.sendCmd(service, 'enable');
  }
  disableService(service: String) {
    console.log('disabling', service);
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
