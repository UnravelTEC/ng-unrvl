import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { MatSliderModule } from '@angular/material/slider';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';
import { GlobalSettingsService } from '../../../core/global-settings.service';

@Component({
  selector: 'app-display-brighness',
  templateUrl: './display-brighness.component.html',
  styleUrls: ['./display-brighness.component.scss']
})
export class DisplayBrighnessComponent implements OnInit {
  @Output()
  brightnessEvent = new EventEmitter<number>();

  constructor(
    private utHTTP: UtFetchdataService,
    private gss: GlobalSettingsService,
    private h: HelperFunctionsService
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
      .subscribe((data: Object) => this.acceptBrighness(data));
  }

  acceptBrighness(data: Object) {
    console.log('retval vom getbn:', data);
    if (data && data['brightness']) {
      this.currentBrightness = data['brightness'];
      this.brightnessEvent.emit(this.currentBrightness);
    }
    // alert('got bn:' + JSON.stringify(data));
    this.disabled = false;
  }

  setBrightness(MatSliderChange) {
    console.log(MatSliderChange);
    // alert(JSON.stringify(MatSliderChange)); // ERROR: cyclic data
    this.utHTTP
      .getHTTPData(
        this.gss.getAPIEndpoint() +
          'screen/brightness.php?bn=' +
          MatSliderChange.value
      )
      .subscribe((data: Object) => this.ack(data));
    this.currentBrightness = MatSliderChange.value;
    this.brightnessEvent.emit(this.currentBrightness);
  }
}
