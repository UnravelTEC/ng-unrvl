import { Component, OnInit } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';

import { GlobalSettingsService } from './core/global-settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'SDARS - Sensor Data Access and Retrieval System';
  prod = environment.production;
  restMsg = '';

  public topBarHidden = false;
  public footerHidden = false;

  public appName = 'Home';

  public cursor = 'auto';
  gap_right = '0px';

  public hostName = 'ng-unrvl';

  public constructor(
    private http: HttpClient,
    private titleService: Title,
    private globalSettings: GlobalSettingsService
  ) {}

  ngOnInit() {
    this.setTitle('UnravelTEC');

    this.globalSettings.changeEmitted$.subscribe(obj => {
      console.log(obj);
      if (obj && obj.hasOwnProperty('fullscreen')) {
        this.toggleFullScreen(obj['fullscreen']);
      }
      if (obj && obj.hasOwnProperty('appName')) {
        this.setAppName(obj['appName']);
      }
      if (obj && obj.hasOwnProperty('footer')) {
        this.toggleFooter(obj['footer']);
      }
      if (obj && obj.hasOwnProperty('TricorderLocal')) {
        if (obj['TricorderLocal'] === true) {
          this.cursor = 'none';
          this.toggleFooter(false);
          // alert('Welcome to Tricorder');
          this.gap_right = '20px'; // bug in Raspi display/browser in portrait mode
        } else {
          this.toggleFooter(true);
          this.cursor = 'auto';
        }
      }
      if (obj && obj.hasOwnProperty('hostname')) {
        this.hostName = obj['hostname'];
        this.setTitle();
      }
    });

    this.globalSettings.ngOnInit();

    if (this.globalSettings.isMobile()) {
      console.log('mobile detected, remove footer');
      this.toggleFooter(false);
    }
  }

  public setTitle(newTitle?: string) {
    if (!newTitle) {
      newTitle = this.hostName + ': ' + this.appName;
    }
    this.titleService.setTitle(newTitle);
  }

  public setAppName(newAppName: string) {
    this.appName = newAppName;
    this.setTitle();
  }

  public toggleFullScreen(newState?: boolean) {
    console.log(['fullscreen toggled to ', newState]);

    if (newState !== undefined) {
      this.topBarHidden = newState;
      this.footerHidden = newState;
    } else {
      this.topBarHidden = !this.topBarHidden;
      this.footerHidden = !this.footerHidden;
    }
  }
  public toggleFooter(newState?: boolean) {
    setTimeout(() => {
      // to prevent ExpressionChangedAfterItHasBeenCheckedError
      console.log(['footer toggled to ', newState]);
      if (newState !== undefined) {
        this.footerHidden = !newState;
      } else {
        this.footerHidden = !this.footerHidden;
      }
    }, 100);
  }
}
