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

  public asc: boolean;

  public calibration_ppm: number;

  public altitude: number;
  public userAltitude: number;
  private ls_api_user;
  private ls_api_pass;

  ngOnInit(): void {
    this.reload();
  }

  reload() {
    this.ls_api_user = this.localStorage.get('api_user');
    this.ls_api_pass = this.localStorage.get('api_pass');
    this.getInterval();
    this.getASC();
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
      .subscribe((data: Object) => this.acceptKey(data, key)),
      (error) => this.gss.displayHTTPerror(error);
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
      if (rv == 'yes') {
        this.asc = true;
      } else if (rv == 'no') {
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
  acceptInterval(data: Object) {
    if (data && data['interval']) {
      this.interval = data['interval'];
      console.log('got ', this.interval);
    } else {
      alert('sensor interval fetch error');
      console.error('sensor interval fetch error', data);
    }
  }
  setInterval() {
    alert('setInterval');
  }

  getASC() {
    this.getEntry('asc');
  }
  toggleASC($event) {
    alert('toggleASC');
  }

  getFRCval() {
    this.getEntry('calibration_ppm');
  }
  FRC() {
    alert('FRC');
  }

  getAltitude() {
    this.getEntry('altitude');
  }
  setAltitude() {
    alert('setAltitude');
  }
}
