import { Component, OnInit, Input } from '@angular/core';

import { interval, Subscription } from 'rxjs';

import { GlobalSettingsService } from '../core/global-settings.service';
import { MqttService } from '../core/mqtt.service';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent implements OnInit {
  @Input()
  hide = false;

  @Input()
  appName = '/';

  public currentTime: Date;
  public hostName = 'uninitialized';
  public statusText = '';

  public showMqttList = false;

  private titleSubscription$;

  private intervalSubscription: Subscription;

  constructor(
    private gss: GlobalSettingsService,
    private mqtt: MqttService // used in html
  ) {}

  ngOnInit() {
    this.currentTime = new Date();
    const tmpHostName = this.gss.server.hostname;
    if (tmpHostName) {
      this.hostName = tmpHostName;
    }
    this.titleSubscription$ = this.gss.changeEmitted$.subscribe((obj: Object) =>
      this.actOnMsg(obj)
    );

    this.intervalSubscription = interval(60000).subscribe(counter => {
      this.currentTime = new Date(); //todo get from backend!
    });
  }
  actOnMsg(obj: Object) {
    if (!obj) return;
    console.log(new Date(), 'got', obj);
    if (obj.hasOwnProperty('hostname')) {
      this.hostName = obj['hostname'];
      return;
    }
    if (obj.hasOwnProperty('status')) {
      this.statusText = obj['status'];
    }
  }
}
