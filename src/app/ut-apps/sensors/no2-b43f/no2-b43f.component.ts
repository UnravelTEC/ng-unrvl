import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../../core/global-settings.service';

@Component({
  selector: 'app-no2-b43f',
  templateUrl: './no2-b43f.component.html',
  styleUrls: ['./no2-b43f.component.scss']
})
export class No2B43fComponent implements OnInit {


  constructor (private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'NO2-B43F' }); }

  ngOnInit() {
  }

}
