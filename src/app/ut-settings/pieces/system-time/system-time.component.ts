import { Component, OnInit } from '@angular/core';
import { UtFetchdataService } from '../../../shared/ut-fetchdata.service';
import { GlobalSettingsService } from '../../../core/global-settings.service';

@Component({
  selector: 'app-system-time',
  templateUrl: './system-time.component.html',
  styleUrls: ['./system-time.component.scss']
})
export class SystemTimeComponent implements OnInit {
  swDate = undefined;
  hwDate = undefined;
  browserDate = new Date();

  constructor(
    private gss: GlobalSettingsService,
    private utHTTP: UtFetchdataService
  ) {}

  ngOnInit() {
    this.getDates();
  }

  getDates() {
    this.utHTTP
      .getHTTPData(this.gss.getAPIEndpoint() + 'system/clock.php')
      .subscribe((data: Object) => this.acceptDates(data));
  }
  acceptDates(data: Object) {
    if (data && data['hwdate']) {
      this.hwDate = new Date(data['hwdate']);
      console.log('got ', data['hwdate']);
    }
    if (data && data['swdate']) {
      this.swDate = new Date(data['swdate']);
      console.log('got ', data['swdate']);
    }
    this.browserDate = new Date();
  }

  setClock() {
    const newdate = new Date().toISOString();
    console.log('setting ' + newdate);

    this.utHTTP
      .getHTTPData(
        this.gss.getAPIEndpoint() +
          'system/clock.php?set=' +
          newdate
      )
      .subscribe((data: Object) => this.acceptDates(data));
  }
}
