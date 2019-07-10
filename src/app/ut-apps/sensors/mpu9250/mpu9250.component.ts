import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';

@Component({
  selector: 'app-mpu9250',
  templateUrl: './mpu9250.component.html',
  styleUrls: ['./mpu9250.component.scss']
})
export class Mpu9250Component implements OnInit {
  math = Math; //needed in html

  step = 200;

  extraDyGraphConfig = {
    strokeWidth: 1.5 //,
    // logscale: true
  };

  graphstyle_acc = {
    position: 'absolute',
    top: '0',
    bottom: '67%',
    left: '1vw',
    right: '10em'
  };
  graphstyle_gyro = {
    position: 'absolute',
    top: '34%',
    bottom: '34%',
    left: '1vw',
    right: '10em'
  };
  graphstyle_mag = {
    position: 'absolute',
    top: '66%',
    bottom: '0.5rem',
    left: '1vw',
    right: '10em'
  };

  dataSeriesLabels = ['x','y','z'];
  labelBlackList = ['__name__', 'interval', 'sensor'];
  startTime = '1m';

  constructor (private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'MPU-9250' }); }

  ngOnInit() {
  }


}

