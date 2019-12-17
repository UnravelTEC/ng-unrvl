import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';

@Component({
  selector: 'app-mics6814',
  templateUrl: './mics6814.component.html',
  styleUrls: ['./mics6814.component.scss']
})
export class Mics6814Component implements OnInit {
  step = '1000';
  extraDyGraphConfig = {
    strokeWidth: 1.5 //,
    // logscale: true
  };
  labelBlackList = ['__name__', 'interval'];
  startTime = '15m';

  mics_enable: boolean;

  graphstyle_red = {
    position: 'absolute',
    top: '0',
    bottom: '67%',
    left: '1vw',
    right: '7em'
  };
  graphstyle_ox = {
    position: 'absolute',
    top: '34%',
    bottom: '34%',
    left: '1vw',
    right: '7em'
  };
  graphstyle_ammo = {
    position: 'absolute',
    top: '66%',
    bottom: '0.5rem',
    left: '1vw',
    right: '7em'
  };
  dataSeriesLabelRed = ['Reducing'];
  dataSeriesLabelOx = ['Oxidizing'];
  dataSeriesLabelAmmo = ['Ammonia'];

  constructor(
    private globalSettings: GlobalSettingsService,
    private utFetchdataService: UtFetchdataService
  ) {
    this.globalSettings.emitChange({ appName: 'MiCS 6814 Gas Sensor' });
  }

  ngOnInit() {
    this.utFetchdataService
      .getHTTPData(
        this.globalSettings.getAPIEndpoint() + 'system/gpio.php?gpio=27'
      )
      .subscribe((data: Object) => this.ack(data));
  }

  toggleMics() {
    this.utFetchdataService
      .getHTTPData(
        this.globalSettings.getAPIEndpoint() +
          'system/gpio.php?gpio=27&status=' +
          (this.mics_enable === true ? 'low' : 'high')
      )
      .subscribe((data: Object) => this.ack(data));

    this.mics_enable = undefined;
  }

  ack(data: Object) {
    console.log('api retval:', data);
    if (data['success'] && data['success'] === true && data['status']) {
      if (data['status'] == 'high') {
        this.mics_enable = true;
      } else if (data['status'] == 'low') {
        this.mics_enable = false;
      }
    }
  }
}
