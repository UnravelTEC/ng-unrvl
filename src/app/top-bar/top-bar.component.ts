import { Component, OnInit, Input } from '@angular/core';

import { interval, Subscription } from 'rxjs';

import { HelperFunctionsService } from '../core/helper-functions.service';
import { GlobalSettingsService } from 'app/core/global-settings.service';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent implements OnInit {
  @Input()
  hide = false;

  @Input()
  appName = '/';

  public currentTime: Date;
  public hostName = "uniitialized";

  private titleSubscription$;

  private intervalSubscription: Subscription;

  constructor(private h: HelperFunctionsService, private gss: GlobalSettingsService) {}

  ngOnInit() {
    this.currentTime = new Date();
    // this.hostName = this.h.getBaseURL().replace(/http[s]?:\/\//, '');
    const tmpHostName = this.gss.getHostName();
    if(tmpHostName) {
      this.hostName = tmpHostName
    } else {
      this.titleSubscription$ = this.gss.changeEmitted$.subscribe(obj => {
        if (obj && obj.hasOwnProperty('hostname')) {
         this.hostName = obj['hostname'];
         this.titleSubscription$.unsubscribe();
        }
      });
    }

    this.intervalSubscription = interval(60000).subscribe(counter => {
      this.currentTime = new Date();
    });
  }

}
