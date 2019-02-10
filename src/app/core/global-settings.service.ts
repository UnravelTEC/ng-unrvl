// from https://stackoverflow.com/questions/37662456/angular-2-output-from-router-outlet

import { Injectable, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { HelperFunctionsService } from './helper-functions.service';
import { LocalStorageService } from './local-storage.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GlobalSettingsService implements OnInit {
  private hostName = 'uninitialized';

  private prometheusRunningOnWebserver = false;
  public defaultPrometheusPath = '/prometheus/api/v1/';
  public defaultPrometheusPort = undefined; // '9090'; // later switch to default port
  private defaultAPIPath = '/api/';
  private fallbackEndpoint = 'https://scpexploratory02.tugraz.at/'
  private fallbackPrometheusEndpoint =
    this.fallbackEndpoint + 'prometheus/api/v1/';
  private fallbackAPI = this.fallbackEndpoint + 'api/';

  public server = {
    type: 'unknown', // Tricorder || PublicServer
    hostname: 'uninitialized',
    hasscreen: undefined, // true || false
    cpu: 'unknown',
    sensors: [],
  }
  public client = {
    type: 'unknown', // local || web
    baseurl: '',
    protocol: 'unknown' // http || https
  }

  public serverType = 'unknown'
  public clientType = 'unknown'; // none: no valid endpoint could be found
  // TricorderWeb
  // TricorderWebHeadless // client of a Raspi sensor node w/o display
  // TricorderLocal // Webif displayed on Tricorder's own screen
  // PublicWeb
  // Development
  public clientProtocol = 'http'; // or https

  // Observable string sources
  private emitChangeSource = new Subject<any>();
  // Observable string streams
  changeEmitted$ = this.emitChangeSource.asObservable();
  // Service message commands
  emitChange(change: any) {
    this.emitChangeSource.next(change);
  }
  constructor(
    private http: HttpClient,
    private h: HelperFunctionsService,
    private localStorage: LocalStorageService
  ) {}

  ngOnInit() {
    const baseurl = this.h.getBaseURL();
    this.client.baseurl = baseurl
    console.log('GlobalSettingsDervice: startup on', baseurl);
    this.testPrometheusOnEndpoint(baseurl);

    let API = this.getAPIEndpoint();
    if (!API) {
      API = this.h.getBaseURL() + '/api/';
    }
    if (API) {
      this.setClientType(API);
      this.fetchHostName(API);
    }

    // fill our information
    // Tricorder | Pubserver
    // tricorder: Prometheus on ARM
  }

  private setClientType(endpoint) {
    if (endpoint.startsWith('http://localhost')) {
      this.http.get('http://localhost/api/screen/getBrightness.php').subscribe(
        (data: Object) => {
          console.log('we are on a Raspi with Raspi-Display!');
          this.client.type = 'local';
        },
        error => {
          console.log('running on localhost without Rpi -> Developing');
          this.clientType = 'Development';
        }
      );
    } else if (endpoint.startsWith('https')) {
      console.log('we are client of a https server.');
      this.clientType = 'PublicWeb';
    } else {
      this.http.get(endpoint + 'screen/getBrightness.php').subscribe(
        (data: Object) => {
          console.log('we are client of a Raspi with Raspi-Display!');
          this.clientType = 'TricorderWeb';
        },
        error => {
          console.log('we are client of something w/o Display!');
          this.clientType = 'TricorderWebHeadless';
        }
      );
    }
  }

  private fetchHostName(server: string) {
    if (
      server.startsWith(this.h.getBaseURL()) &&
      this.getPrometheusEndpoint() == this.fallbackPrometheusEndpoint
    ) {
      server = this.fallbackAPI;
    }
    this.http.get(server + 'system/hostname.php').subscribe(
      (data: Object) => this.setHostName(data),
      error => {
        console.log('no UTapi running on');
        console.log(error);
        this.hostName = 'unknown';
        this.emitChange({ hostname: this.hostName });
      }
    );
  }
  public setHostName(data: Object) {
    if (data['hostname']) {
      this.hostName = data['hostname'];
    } else {
      console.error('hostname cmd returned no hostname');
      this.hostName = 'undefined';
    }

    this.emitChange({ hostname: this.hostName });
  }

  public getHostName(): string {
    return this.hostName;
  }

  // order - what is the criteria a server must met?
  // prometheus running? - yes
  // api running? - maybe
  // 1. local storage settings
  // 2. hostname of url (if api working)
  // 3. fallback to Newton

  // following use cases:
  // developing on localhost:4200 with ng
  // - default: connect to Newton
  // - connect to other tricorders on demand
  // connected to a Tricorder
  // using public Webif on Newton:
  // - default: stay on newton
  // - try out switching to another server

  testPrometheusOnEndpoint(endpoint: string) {
    if (!endpoint.endsWith(this.defaultPrometheusPath)) {
      endpoint = endpoint + this.defaultPrometheusPath;
    }
    // console.log('testing prometheus on', endpoint);
    this.http
      .get(endpoint + 'query?query=scrape_samples_scraped')
      .subscribe(
        (data: Object) => this.prometheusTestSuccess(data),
        error => this.prometheusTestFailure(error)
      );
  }
  prometheusTestSuccess(data: Object) {
    if (data['status'] && data['status'] === 'success') {
      this.prometheusRunningOnWebserver = true;
      // console.log('SUCCESS: prometheus found on endpoint');

      // FIXME because service not ready in ngOnInit do it here
      const API = this.getAPIEndpoint();
      if (API) {
        this.fetchHostName(API);
      } else {
        console.error('no API available');
      }
    }
  }
  prometheusTestFailure(error) {
    // console.log('no prometheus found on endpoint');
    // console.log(error);
    const API = this.getAPIEndpoint();
    if (API) {
      this.fetchHostName(API);
    } else {
      console.error('no API available');
    }
    true;
  }

  getPrometheusEndpoint() {
    // 1. local storage
    // 2. hostname of webserver
    // 3. fallback
    const localSettings = this.localStorage.get('globalSettings');
    if (this.h.getDeep(localSettings, ['server', 'settings'])) {
      // localstorage
      const settings = this.h.getDeep(localSettings, ['server', 'settings']);

      const protocol = settings['prometheusProtocol']['fieldValue'];
      const server = settings['serverHostName']['fieldValue'];
      let port = settings['prometheusPort']['fieldValue'];
      if (Number(port) > 0) {
        port = ':' + port;
      }
      let path = settings['prometheusPath']['fieldValue'];
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
      if (!path.endsWith('/')) {
        path = path + '/';
      }
      return protocol + '://' + server + port + path;
    }

    if (this.prometheusRunningOnWebserver) {
      // hostname of webserver
      const port = this.defaultPrometheusPort
        ? ':' + this.defaultPrometheusPort
        : '';
      return this.h.getBaseURL() + port + this.defaultPrometheusPath;
    } else {
      // fallback
      return this.fallbackPrometheusEndpoint;
    }
  }

  getAPIEndpoint() {
    const localSettings = this.localStorage.get('globalSettings');
    if (this.h.getDeep(localSettings, ['server', 'settings'])) {
      const settings = this.h.getDeep(localSettings, ['server', 'settings']);

      const protocol = settings['apiProtocol']['fieldValue'];
      const server = settings['serverHostName']['fieldValue'];
      let port = settings['apiPort']['fieldValue'];
      if (port) {
        port = ':' + port;
      }
      let path = settings['apiPath']['fieldValue'];
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
      if (!path.endsWith('/')) {
        path = path + '/';
      }
      return protocol + '://' + server + port + path;
    }

    if (this.prometheusRunningOnWebserver) {
      return this.h.getBaseURL() + this.defaultAPIPath;
    } else {
      return undefined;
    }
  }
}
