import { Component, OnInit } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';

import { GlobalSettingsService } from './core/global-settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'SDARS - Sensor Data Access and Retrieval System';
  prod = environment.production;
  restMsg = '';

  public topBarHidden = false;
  public footerHidden = false;

  public appName = 'Home';

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
    });

    // this.http.get('/rest/test').subscribe(
    //   value => {
    //     this.restMsg = value['msg'];
    //   },
    //   error => {
    //     this.restMsg = error.message;
    //   }
    // );
  }

  public setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }

  public setAppName(newAppName: string) {
    this.appName = newAppName;
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
}
