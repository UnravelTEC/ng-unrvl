import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { GlobalSettingsService } from '../../../core/global-settings.service';

@Component({
  selector: 'app-fan-speed',
  templateUrl: './fan-speed.component.html',
  styleUrls: ['./fan-speed.component.scss']
})
export class FanSpeedComponent implements OnInit {
  @Output()
  fanSpeedEvent = new EventEmitter<number>();

  public currentSpeed = 0;
  disabled = true;

  constructor(
    private utHTTP: UtFetchdataService,
    private gss: GlobalSettingsService
  ) {}

  ngOnInit() {
    if (this.gss.getAPIEndpoint()) {
      this.getSpeed();
      this.fanSpeedEvent.emit(this.currentSpeed);
    }
  }

  ack(data: Object) {
    console.log(data);
    return;
  }

  getSpeed() {
    console.log('getspeed called');
    // alert('get bn called');
    this.utHTTP
      .getHTTPData(this.gss.getAPIEndpoint() + 'system/fan.php')
      .subscribe(
        (data: Object) => this.acceptSpeed(data),
        (error: any) => {
          console.log('no fan API present.');
          console.log(error);
        }
      );
  }

  acceptSpeed(data: Object) {
    console.log('retval vom getspeed:', data);
    if (data && data['fanspeed'] !== undefined) {
      this.currentSpeed = data['fanspeed'];
      this.fanSpeedEvent.emit(this.currentSpeed);
      this.disabled = false;
    }
    // alert('got bn:' + JSON.stringify(data));
  }

  setSpeed(MatSliderChange) {
    console.log('new value', MatSliderChange.value);
    // alert(JSON.stringify(MatSliderChange)); // ERROR: cyclic data
    this.utHTTP
      .getHTTPData(
        this.gss.getAPIEndpoint() +
          'system/fan.php?fanspeed=' +
          MatSliderChange.value
      )
      .subscribe((data: Object) => this.ack(data));
    this.currentSpeed = MatSliderChange.value;
    this.fanSpeedEvent.emit(this.currentSpeed);
  }
}
