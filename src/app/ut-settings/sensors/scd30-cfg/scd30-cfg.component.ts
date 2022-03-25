import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';
import { LocalStorageService } from 'app/core/local-storage.service';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';

@Component({
  selector: 'app-scd30-cfg',
  templateUrl: './scd30-cfg.component.html',
  styleUrls: ['./scd30-cfg.component.scss'],
})
export class Scd30CfgComponent implements OnInit {
  constructor(
    public gss: GlobalSettingsService,
    private localStorage: LocalStorageService,
    private utHTTP: UtFetchdataService
  ) {}

  public interval: number;
  public userInterval: number;
  public intervalText = '';

  public asc: boolean;
  public ascText = '';

  public calibration_ppm: number;
  public calibrationText = '';
  public do_frc = false;

  public altitude: number;
  public userAltitude: number;
  public altitudeText = '';

  public services = []; // only gets filled with 1 entry
  public loadingText = 'Initializing...';

  private ls_api_user;
  private ls_api_pass;

  ngOnInit(): void {
    this.reload();
  }

  reload() {
    this.ls_api_user = this.localStorage.get('api_user');
    this.ls_api_pass = this.localStorage.get('api_pass');
    this.getService();
    // this.getInterval();
    // this.getASC();
    this.getFRCval();
    this.getAltitude();
  }
  getEntry(key) {
    this.utHTTP
      .getHTTPData(
        this.gss.getAPIEndpoint() +
          'system/ut-config.php?cmd=get&service=scd30&k=' +
          key,
        this.ls_api_user,
        this.ls_api_pass,
        true
      )
      .subscribe(
        (data: Object) => this.acceptKey(data, key),
        (error) => this.gss.displayHTTPerror(error)
      );
  }
  acceptKey(data, key) {
    let rv;
    if (data && data[key]) {
      rv = data[key];
      console.log('got ', rv, 'for', key);
    } else {
      alert('fetch error for ' + key);
      console.error('fetch error for', key, 'data:', data);
      return;
    }
    if (key == 'interval') {
      this.interval = rv;
      this.userInterval = this.interval;
      return;
    }
    if (key == 'asc') {
      if (rv == 'yes' || rv == 'true' || rv == '1') {
        this.asc = true;
      } else if (rv == 'no' || rv == 'false' || rv == '0') {
        this.asc = false;
      } else {
        console.error('error in parsing asc value', rv);
      }
      return;
    }
    if (key == 'calibration_ppm') {
      this.calibration_ppm = rv;
      return;
    }
    if (key == 'altitude') {
      this.altitude = rv;
      this.userAltitude = rv;
    }
  }

  getInterval() {
    this.getEntry('interval');
  }

  setInterval() {
    // alert('setInterval');
    this.intervalText = 'Setting interval...';
    this.stopService('scd30');
    this.utHTTP
      .getHTTPData(
        this.gss.getAPIEndpoint() +
          'system/ut-config.php?cmd=set&service=scd30&k=interval&v=' +
          this.userInterval,
        this.ls_api_user,
        this.ls_api_pass,
        true
      )
      .subscribe(
        (data: Object) => {
          this.acceptKey(data, 'interval');
          this.intervalText = 'Reloading Service...';
          this.startService('scd30');
        },
        (error) => this.gss.displayHTTPerror(error)
      );
  }

  getASC() {
    this.getEntry('asc');
  }
  toggleASC($event) {
    this.stopService('scd30');
    const webparam = this.asc ? 'yes' : 'no';
    this.ascText = 'Setting asc to ' + webparam + '...';
    // alert('toggleASC to ' + webparam);
    this.utHTTP
      .getHTTPData(
        this.gss.getAPIEndpoint() +
          'system/ut-config.php?cmd=set&service=scd30&k=asc&v=' +
          webparam,
        this.ls_api_user,
        this.ls_api_pass,
        true
      )
      .subscribe(
        (data: Object) => {
          this.acceptKey(data, 'asc');
          this.ascText = 'Reloading Service...';
          this.startService('scd30');
        },
        (error) => this.gss.displayHTTPerror(error)
      );
  }

  getFRCval() {
    this.getEntry('calibration_ppm');
  }
  FRC() {
    // alert('FRC');
    this.calibrationText = 'Setting FRC calibration ppm...';
    this.utHTTP
      .getHTTPData(
        this.gss.getAPIEndpoint() +
          'system/ut-config.php?cmd=set&service=scd30&k=calibration_ppm&v=' +
          this.calibration_ppm,
        this.ls_api_user,
        this.ls_api_pass,
        true
      )
      .subscribe(
        (data: Object) => {
          this.acceptKey(data, 'calibration_ppm');
          this.do_frc = true;
          this.calibrationText =
            'Stopping running measurement for recalibration...';
          this.stopService('scd30'); // function kickFRC continues when service stopped
        },
        (error) => this.gss.displayHTTPerror(error)
      );
  }
  kickFRC() { // called from acceptService when stopping completed
    this.calibrationText = 'Starting Recalibration...';
    this.utHTTP
      .getHTTPData(
        this.gss.getAPIEndpoint() + 'system/frc.php?service=scd30',
        this.ls_api_user,
        this.ls_api_pass,
        true
      )
      .subscribe(
        (data: Object) => {
          this.do_frc = false;
          this.calibrationText =
            'Recalibration ' + (data['success'] ? 'done.' : 'failed.');
          this.startService('scd30');
        },
        (error) => this.gss.displayHTTPerror(error)
      );
  }

  getAltitude() {
    this.getEntry('altitude');
  }
  setAltitude() {
    // alert('setAltitude');
    this.altitudeText = 'Setting altitude...';
    this.stopService('scd30');
    this.utHTTP
      .getHTTPData(
        this.gss.getAPIEndpoint() +
          'system/ut-config.php?cmd=set&service=scd30&k=altitude&v=' +
          this.userAltitude,
        this.ls_api_user,
        this.ls_api_pass,
        true
      )
      .subscribe(
        (data: Object) => {
          this.acceptKey(data, 'altitude');
          this.altitudeText = 'Reloading Service...';
          this.startService('scd30');
        },
        (error) => this.gss.displayHTTPerror(error)
      );
  }

  // copied & modified from services.component TODO split into ng service
  getService() {
    this.utHTTP
      .getHTTPData(
        this.gss.getAPIEndpoint() + 'system/services.php?service=scd30'
      )
      .subscribe(
        (data: Object) => this.acceptService(data),
        (error) => this.gss.displayHTTPerror(error)
      );
    this.loadingText = 'Loading...';
  }
  acceptService(data: Object) {
    console.log('services:', data);
    if (data && data['services']) {
      this.services = data['services'];
      this.loadingText = '';
      this.intervalText = '';
      this.altitudeText = '';
      this.ascText = '';
      this.calibrationText = '';
      if (this.services[0]['running'] === false && this.do_frc) {
        this.kickFRC();
      }
    } else {
      this.loadingText = 'Error, no SCD30 service.';
    }
  }

  // copied from services.component TODO split into ng service
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
        this.gss.getAPIEndpoint() +
          'system/service.php?cmd=' +
          cmd +
          '&service=' +
          service,
        this.ls_api_user,
        this.ls_api_pass,
        true
      )
      .subscribe(
        (data: Object) => this.checkSuccessOfCommand(data),
        (error) => this.gss.displayHTTPerror(error)
      );
  }
  checkSuccessOfCommand(data: Object) {
    console.log('success:', data);
    if (!data['success']) {
      alert('last command unsuccessful');
    } else {
      this.getService();
    }
  }
}
