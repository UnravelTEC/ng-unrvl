import { Component, OnInit, Input } from '@angular/core';

import { interval, Subscription } from 'rxjs';

import { HelperFunctionsService } from '../core/helper-functions.service';

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
  public hostName: string;

  private intervalSubscription: Subscription;

  constructor(private h: HelperFunctionsService) {}

  ngOnInit() {
    this.currentTime = new Date();
    this.hostName = this.h.getBaseURL().replace(/http[s]?:\/\//, '');

    this.intervalSubscription = interval(60000).subscribe(counter => {
      this.currentTime = new Date();
    });
  }
}
