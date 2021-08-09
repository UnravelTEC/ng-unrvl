import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';

@Component({
  selector: 'app-calibration',
  templateUrl: './calibration.component.html',
  styleUrls: ['./calibration.component.scss']
})
export class CalibrationComponent implements OnInit {

  constructor (private gss: GlobalSettingsService) {
    this.gss.emitChange({ appName: 'calibration' }); }

  ngOnInit(): void {
  }

}
