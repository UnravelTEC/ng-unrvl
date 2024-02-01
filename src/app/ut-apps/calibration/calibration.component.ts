import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';
import { UntypedFormControl } from '@angular/forms';
import { now } from 'lodash-es';

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

  displaySensorContent = {}
  toggleSensorContent(id) {
    if (!this.displaySensorContent.hasOwnProperty(id)) {
      this.displaySensorContent[id] = true;
      return;
    }
    this.displaySensorContent[id] = !this.displaySensorContent[id];
  }

  public now = new Date();
  public newcaldate = this.now;
  public d = 0;
  public k = 1;
  public s2 = 0;
  public note = '';

  public calDate = new UntypedFormControl(this.newcaldate);
  public minutes = 0;
  public hours = 0;
  splitDates() {
    this.minutes = this.newcaldate.getMinutes();
    this.hours = this.newcaldate.getHours();
    this.newcaldate.setHours(0);
    this.newcaldate.setMinutes(0);
    this.newcaldate.setSeconds(0);
    this.newcaldate.setMilliseconds(0);
    this.calDate = new UntypedFormControl(this.newcaldate);
  }

  constructor(
    public gss: GlobalSettingsService,
    public utHTTP: UtFetchdataService
  ) {
    this.gss.emitChange({ appName: 'Sensor Calibrations' });
  }

  ngOnInit(): void {
    this.splitDates();
  }

  changeCalDate($event) {
    this.newcaldate = $event['value'];
  }

  sendCal(sensor, id, measurement, field) {
    console.log('enter cal for', sensor, id, measurement, field);
    console.log('cal factors:', this.d, this.k, this.s2, this.note);
    id = id.replace(/([&\s])/g, '\\$1');
    const timestamp_str =
      String(
        Math.round(this.newcaldate.valueOf() / 1000) +
          this.hours * 3600 +
          this.minutes * 60
      ) + '000000000';
    let influxstring = `calibrations,sensor=${sensor},id=${id},meas=${measurement},field=${field}`;
    //note: note has to be sent, it has to be the empty string because otherwise one column would be missing
    influxstring += ` x0=${this.d},x1=${this.k},x2=${this.s2},note="${this.note}" ${timestamp_str}`;
    console.log('data');

    this.utHTTP
      .postData(this.utHTTP.buildInfluxWriteUrl(), influxstring)
      .subscribe(
        (res: any) => console.log(res),
        (error) => this.gss.displayHTTPerror(error)
      );
    this.newcaldate = new Date();
    this.splitDates();

    this.reload(500);
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
    this.reload(500);
  }
  checkDel(data) {
    console.log('after del', data);
  }
  reload(timeout = 0) {
    setTimeout(() => {
      this.gss.emitChange({ readyToFetchCalibrations: true });
    }, timeout);
  }
}
