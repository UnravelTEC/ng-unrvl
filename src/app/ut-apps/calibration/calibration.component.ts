import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';

@Component({
  selector: 'app-calibration',
  templateUrl: './calibration.component.html',
  styleUrls: ['./calibration.component.scss']
})
export class CalibrationComponent implements OnInit {

/* calibration table format:

a calibration point is identified by:
* sensor
* id
* fieldname ()

the calibration data consists of:
* calibration date
* factors n0 - n7, where
  * n0 = offset
  * n1 = multiplicative
  * n2 = x²
  * n3 = x³
  * ...
* if hardware recalibration done (eg SCD30), calibrated value, date == calibration date

either calibration factors or hardware recalibration have to be done (both also possible in one timestamp)

*/

  constructor (public gss: GlobalSettingsService) {
    this.gss.emitChange({ appName: 'calibration' }); }

  ngOnInit(): void {
  }



}
