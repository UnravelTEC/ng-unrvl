import { Component, OnInit } from '@angular/core';
import { MatSliderModule } from '@angular/material/slider';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';
import { LocalStorageService } from 'app/core/local-storage.service';
import { HelperFunctionsService } from 'app/core/helper-functions.service';

@Component({
  selector: 'app-display-brighness',
  templateUrl: './display-brighness.component.html',
  styleUrls: ['./display-brighness.component.scss']
})
export class DisplayBrighnessComponent implements OnInit {
  constructor(
    private utHTTP: UtFetchdataService,
    private localStorage: LocalStorageService,
    private h: HelperFunctionsService
  ) {}

  public currentBrightness = 64;

  ngOnInit() {
    this.getBrightness();
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
    if (data && data['brighness']) {
      this.currentBrightness = data['brightness'];
    }
  }

  setBrightness(MatSliderChange) {
    console.log(MatSliderChange);
    // if(MatSliderChange && MatSliderChange['value'])
    this.utHTTP
      .getHTTPData(this.getServer() + 'screen/brightness.php?bn=' + MatSliderChange.value)
      .subscribe((data: Object) => this.ack(data));
  }

  getServer(): string {
    const globalSettings = this.localStorage.get('globalSettings');
    const server = this.h.getDeep(globalSettings, [
      'server',
      'settings',
      'serverHostName',
      'fieldValue'
    ]);
    return 'http://' + server + '/api/';
  }
}
