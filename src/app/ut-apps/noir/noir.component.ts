import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

@Component({
  selector: 'app-noir',
  templateUrl: './noir.component.html',
  styleUrls: ['./noir.component.scss']
})
export class NoirComponent implements OnInit {
  ledstatus = 'off';
  cameraRunning = false;

  cameraHere = false;

  loading = true;

  constructor(
    private globalSettings: GlobalSettingsService,
    private utFetchdataService: UtFetchdataService
  ) {
    this.globalSettings.emitChange({ appName: 'NoIR-Camera' });
  }

  ngOnInit() {
    if (this.globalSettings.getAPIEndpoint()) {
      this.start();
      this.globalSettings.emitChange({ footer: false });
    } else {
      this.loading = false;
    }
  }

  ngOnDestroy() {
    if (this.globalSettings.getAPIEndpoint()) {
      this.stop();
    }
    this.globalSettings.emitChange({ footer: true });
  }

  start() {
    this.utFetchdataService
      .getHTTPData(this.globalSettings.getAPIEndpoint() + 'noir/running.php')
      .subscribe((data: Object) => this.ack(data));
  }

  stop() {
    this.utFetchdataService
      .getHTTPData(this.globalSettings.getAPIEndpoint() + 'noir/stopping.php')
      .subscribe((data: Object) => this.ack(data));
  }

  ack(data: Object) {
    console.log('api retval:', data);

    this.cameraHere = true;
    this.loading = false;

    if (data.hasOwnProperty('cameraRunning')) {
      console.log('bef. switch');
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
        this.globalSettings.getAPIEndpoint() +
          'noir/ir-led.php?irstatus=' +
          newstat
      )
      .subscribe((data: Object) => this.ack(data));

    this.ledstatus = 'pending';
  }
}
