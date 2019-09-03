import { Component, OnInit } from '@angular/core';

import { GlobalSettingsService } from '../../core/global-settings.service';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  scrHeight: any;
  scrWidth: any;

  tilewidth: any;
  tileheight: any;

  constructor(private globalSettings: GlobalSettingsService) {
    // has to be here instead of ngOnInit, otherwise ExpressionChangedAfterItHasBeenCheckedError
    this.globalSettings.emitChange({ appName: 'Dashboard' });
    this.getScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  getScreenSize(event?) {
    this.scrHeight = window.innerHeight;
    this.scrWidth = window.innerWidth;
    this.tilewidth = Math.round(this.scrHeight * 0.3);
    this.tileheight = this.tilewidth;
    console.log('height:', this.tileheight);

    console.log(this.scrHeight, this.scrWidth);
  }

  ngOnInit() {}
}
