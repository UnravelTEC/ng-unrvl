import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { MatSliderModule } from '@angular/material/slider';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { LocalStorageService } from '../../../core/local-storage.service';
import { HelperFunctionsService } from '../../../core/helper-functions.service';

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
    private localStorage: LocalStorageService,
    private h: HelperFunctionsService
  ) {}

  public currentBrightness = 64;
  private ourHostName: string;

  ngOnInit() {
    this.getBrightness();
    this.ourHostName = this.h.getBaseURL();
    this.brightnessEvent.emit(this.currentBrightness);
  }

  ack(data: Object) {
    console.log(data);
    return;
  }

  getBrightness() {
    console.log('getbn called');
    this.utHTTP
      .getHTTPData(this.getServer() + 'screen/getBrightness.php')
      .subscribe((data: Object) => this.acceptBrighness(data));
  }

  acceptBrighness(data: Object) {
    console.log('retval vom getbn:', data);
    if (data && data['brightness']) {
      this.currentBrightness = data['brightness'];
      this.brightnessEvent.emit(this.currentBrightness);
    }
  }

  setBrightness(MatSliderChange) {
    console.log(MatSliderChange);
    // if(MatSliderChange && MatSliderChange['value'])
    this.utHTTP
      .getHTTPData(
        this.getServer() + 'screen/brightness.php?bn=' + MatSliderChange.value
      )
      .subscribe((data: Object) => this.ack(data));
    this.currentBrightness = MatSliderChange.value;
    this.brightnessEvent.emit(this.currentBrightness);
  }

  getServer(): string {
    const globalSettings = this.localStorage.get('globalSettings');
    let server = this.h.getDeep(globalSettings, [
      'server',
      'settings',
      'serverHostName',
      'fieldValue'
    ]);
    if (!server) {
      return this.ourHostName + '/api/';
    }
    return 'http://' + server + '/api/';
  }
}
