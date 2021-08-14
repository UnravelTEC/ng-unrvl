import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-calibration',
  templateUrl: './calibration.component.html',
  styleUrls: ['./calibration.component.scss'],
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
  displayAddRows = {}; // used in HTML
  toggleRow(id) {
    if (!this.displayAddRows.hasOwnProperty(id)) {
      this.displayAddRows[id] = true;
      return;
    }
    this.displayAddRows[id] = !this.displayAddRows[id];
  }

  newcaldate = new Date();
  d = 0;
  k = 1;
  s2 = 0;
  note = '';

  public now = new Date();
  public calDate = new FormControl(new Date());

  constructor(
    public gss: GlobalSettingsService,
    public utHTTP: UtFetchdataService
  ) {
    this.gss.emitChange({ appName: 'Sensor Calibrations' });
  }

  ngOnInit(): void {}

  changeCalDate($event) {
    this.newcaldate = $event['value'];
  }

  sendCal(sensor, id, measurement, field) {
    console.log('enter cal for', sensor, id, measurement, field);
    console.log('cal factors:', this.d, this.k, this.s2, this.note);
    id = id.replace(/([&\s])/g, '\\$1');
    const timestamp_str =
      String(Math.round(this.newcaldate.valueOf() / 1000)) + '000000000';
    let influxstring = `calibrations,sensor=${sensor},id=${id},meas=${measurement},field=${field}`;
    //note: note has to be sent, it has to be the empty string because otherwise one column would be missing
    influxstring += ` x0=${this.d},x1=${this.k},x2=${this.s2},note="${this.note}" ${timestamp_str}`;
    console.log('data');

    this.utHTTP.postData(this.utHTTP.buildInfluxWriteUrl(), influxstring);
    this.newcaldate = new Date();
    this.gss.emitChange({ readyToFetchCalibrations: true });
  }
  delCal(timestamp, sensor, id, measurement, field) {
    console.log('del cal for', timestamp, sensor, id, measurement, field);
    const timestamp_str =
      String(Math.round(timestamp.valueOf() / 1000)) + '000000000';
    const delquery =
      'DELETE FROM calibrations WHERE ' +
      `sensor='${sensor}' AND id='${id}' AND meas='${measurement}' AND "field"='${field}' AND time=${timestamp_str}`;
    this.utHTTP
      .getHTTPData(this.utHTTP.buildInfluxDelQuery(delquery))
      .subscribe(
        (data: Object) => this.checkDel(data),
        (error) => this.gss.displayHTTPerror(error)
      );
    setTimeout(() => {
      this.gss.emitChange({ readyToFetchCalibrations: true });
    }, 500)

  }
  checkDel(data) {
    console.log('after del', data);
  }
}
