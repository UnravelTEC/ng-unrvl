import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';

@Component({
  selector: 'app-no2',
  templateUrl: './no2.component.html',
  styleUrls: ['./no2.component.scss']
})
export class No2Component implements OnInit {

  
  constructor (private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'NO2' }); }

  /*
    data needed:
    adns voltage, tagged with NO2 and sensor serial + afe serial
    calibration factors needed:
    * differential offset (from db, changes?) - FOR SENSOR WITH SERIAL
    * mv/ppb scale factor (from db) - FOR SENSOR WITH SERIAL
    * log-threshold (see helper/ smoothNO2)
    * 
    * we have 2 NO2 sensors -> but they've different names anyway.
  */

  ngOnInit(): void {
  }

}
