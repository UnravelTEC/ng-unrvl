import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from 'app/core/local-storage.service';

@Component({
  selector: 'app-display-brightness',
  templateUrl: './display-brightness.component.html',
  styleUrls: ['./display-brightness.component.scss'],
})
export class DisplayBrighnessComponent implements OnInit {
  @Output()
  brightnessEvent = new EventEmitter<number>();

  constructor(
    private utHTTP: UtFetchdataService,
    private gss: GlobalSettingsService,
    private localStorage: LocalStorageService
  ) {}

  public currentBrightness = 64;
  disabled = true;

  ngOnInit() {
    if (this.gss.getAPIEndpoint()) {
      this.getBrightness();
      this.brightnessEvent.emit(this.currentBrightness);
    }
  }

  ack(data: Object) {
    console.log(data);
    return;
  }

  getBrightness() {
    console.log('getbn called');
    // alert('get bn called');
    this.utHTTP
      .getHTTPData(this.gss.getAPIEndpoint() + 'screen/getBrightness.php')
      .subscribe((data: Object) => this.acceptBrightness(data));
  }

  acceptBrightness(data: Object) {
    console.log('retval vom getbn:', data);
    if (data && data['brightness']) {
      this.currentBrightness = data['brightness'];
      this.brightnessEvent.emit(this.currentBrightness);
      this.disabled = false;
    }
    // alert('got bn:' + JSON.stringify(data));
  }

  setBrightness(MatSliderChange) {
    console.log(MatSliderChange);
    // alert(JSON.stringify(MatSliderChange)); // ERROR: cyclic data
    this.utHTTP
      .getHTTPData(
        this.gss.getAPIEndpoint() +
          'screen/brightness.php?bn=' +
          MatSliderChange.value,
        this.localStorage.get('api_user'),
        this.localStorage.get('api_pass'),
        true
      )
      .subscribe((data: Object) => this.ack(data));
    this.currentBrightness = MatSliderChange.value;
    this.brightnessEvent.emit(this.currentBrightness);
  }
}
