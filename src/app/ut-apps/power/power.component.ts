import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';

@Component({
  selector: 'app-power',
  templateUrl: './power.component.html',
  styleUrls: ['./power.component.scss']
})
export class PowerComponent implements OnInit {
  step = 1000;

  style = {
    voltage: {
      // top left
      position: 'absolute',
      top: '1.4em',
      bottom: '50%',
      left: '1vw',
      right: '51vw'
    },
    cpu_voltage: {
      // right upper half of top
      position: 'absolute',
      top: '1%',
      bottom: '75%',
      left: '51vw',
      right: '1vw'
    },
    cpu_undervolt: {
      // right lower half of top
      position: 'absolute',
      top: '26%',
      bottom: '50%',
      left: '51vw',
      right: '1vw'
    },
    power_W: {
      // bottom left
      position: 'absolute',
      top: '50%',
      bottom: '1vh',
      left: '1vw',
      right: '51vw'
    },
    current_A: {
      // bottom right
      position: 'absolute',
      top: '50%',
      bottom: '1vh',
      left: '51vw',
      right: '1vw'
    }
  };

  labels = {
    voltage: ['Voltage'],
    cpu_voltage: ['cpu_voltage'],
    cpu_undervolt: ['cpu_undervolt'],
    power_W: ['power_W'],
    current_A: ['current_A']
  };

  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'Power' });
  }

  ngOnInit() {}
}
