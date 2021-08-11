import { Component, OnInit } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';

import { GlobalSettingsService } from './core/global-settings.service';
import { UtFetchdataService } from './shared/ut-fetchdata.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
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
    private utHTTP: UtFetchdataService,
    private titleService: Title,
    private gss: GlobalSettingsService
  ) {}

  ngOnInit() {
    this.setTitle('UnravelTEC');

    this.gss.changeEmitted$.subscribe((obj) => {
      console.log(obj);
      if (!obj) {
        return;
      }
      if (obj.hasOwnProperty('fullscreen')) {
        this.toggleFullScreen(obj['fullscreen']);
        return;
      }
      if (obj.hasOwnProperty('appName')) {
        this.setAppName(obj['appName']);
        return;
      }
      if (obj.hasOwnProperty('footer')) {
        this.toggleFooter(obj['footer']);
        return;
      }
      if (obj.hasOwnProperty('TricorderLocal')) {
        if (obj['TricorderLocal'] === true) {
          this.cursor = 'none';
          this.toggleFooter(false);
          // alert('Welcome to Tricorder');
          this.gap_right = '20px'; // bug in Raspi display/browser in portrait mode
        } else {
          this.toggleFooter(true);
          this.cursor = 'auto';
        }
        return;
      }
      if (obj.hasOwnProperty('hostname')) {
        this.hostName = obj['hostname'];
        this.setTitle();
        return;
      }
      if (obj.hasOwnProperty('InfluxUP')) {
        if (obj['InfluxUP'] === true) {
          this.getInfluxDBOverview();
        } else {
          this.gss.server.measurements = [];
          this.gss.server.sensors = {};
        }
        return;
      }
      if (obj.hasOwnProperty('InfluxSeriesThere')) {
        this.getFieldsOfSeries();
      }
    });

    this.gss.ngOnInit();

    if (this.gss.isMobile()) {
      console.log('mobile detected, remove footer');
      this.toggleFooter(false);
    }
  }
  getInfluxDBOverview() {
    // here to avoid cyclic dependency gss <=> uthttp
    this.utHTTP
      .getHTTPData(this.utHTTP.buildInfluxQuery('show series'))
      .subscribe((data: Object) =>
        this.gss.handleInfluxSeries(data)
      );
  }

  /*
    fills gss.sensors obj with fields used later in looking up calibration data
  */
  public getFieldsOfSeries() {
    const measurements = this.gss.server.measurements;
    let fieldquery = '';
    measurements.forEach(measurement => {
      fieldquery += `SELECT LAST(*) FROM "${measurement}" group by sensor,id;`
    });
    // console.error(fieldquery);
    this.utHTTP
      .getHTTPData(this.utHTTP.buildInfluxQuery(fieldquery))
      .subscribe((data: Object) =>
      this.gss.acceptFieldsOfSeries(data)
    );
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
