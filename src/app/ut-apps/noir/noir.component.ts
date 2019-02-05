import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../core/helper-functions.service';
import { LocalStorageService } from '../../core/local-storage.service';

@Component({
  selector: 'app-noir',
  templateUrl: './noir.component.html',
  styleUrls: ['./noir.component.scss']
})
export class NoirComponent implements OnInit {
  ledstatus = 'off';
  cameraRunning = false;

  constructor(
    private globalSettings: GlobalSettingsService,
    private localStorage: LocalStorageService,
    private utFetchdataService: UtFetchdataService,
    private h: HelperFunctionsService
  ) {
    this.globalSettings.emitChange({ appName: 'NoIR-Camera' });
  }

  ngOnInit() {
    this.start();
  }

  ngOnDestroy() {
    this.stop();
  }

  start() {
    this.utFetchdataService
      .getHTTPData(this.getServer() + '/api/noir/running.php')
      .subscribe((data: Object) => this.ack(data));
  }

  stop() {
    this.utFetchdataService
      .getHTTPData(this.getServer() + '/api/noir/stopping.php')
      .subscribe((data: Object) => this.ack(data));
  }

  ack(data: Object) {
    console.log('api retval:', data);
    if (data['cameraRunning']) {
      switch (data['cameraRunning']) {
        case true:
          this.cameraRunning = true;
          break;
        case false:
          this.cameraRunning = false;
          break;
        default:
          console.log(
            'retval of cameraRunning incorrect:',
            data['cameraRunning']
          );
          break;
      }
    }

    if (data['ledstatus']) {
      switch (data['ledstatus']) {
        case 'on':
          this.ledstatus = 'on';
          break;
        case 'off':
          this.ledstatus = 'off';
          break;
        case 'auto':
          this.ledstatus = 'auto';
          break;
        default:
          console.log('retval of ledstatus incorrect:', data['ledstatus']);
          break;
      }
    }
  }

  led(newstat: string) {
    this.utFetchdataService
      .getHTTPData(
        this.getServer() + '/api/noir/ir-led.php?irstatus=' + newstat
      )
      .subscribe((data: Object) => this.ack(data));

    this.ledstatus = 'pending';
  }

  getServer(): string {
    const globalSettings = this.localStorage.get('globalSettings');
    let server = this.h.getDeep(globalSettings, [
      'server',
      'settings',
      'serverHostName',
      'fieldValue'
    ]);
    if(!server) {
      server = 'localhost';
    }
    return 'http://' + server;
  }
}
