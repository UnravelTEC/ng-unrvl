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
  private hostName = '';

  private prometheusRunningOnWebserver = false;
  public defaultPrometheusPath = '/prometheus/api/v1/';
  public defaultPrometheusPort = undefined; // '9090'; // later switch to default port
  private defaultAPIPath = '/api/';
  private fallbackPrometheusEndpoint =
    'https://scpexploratory02.tugraz.at/prometheus/api/v1/';

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
    console.log('GlobalSettingsDervice: startup');
    this.testPrometheusOnEndpoint(this.h.getBaseURL());
    const API = this.getAPIEndpoint();
    if (API) {
      this.fetchHostName(API);
    }
  }

  private fetchHostName(server: string) {
    this.http
      .get(server + 'system/hostname.php')
      .subscribe(
        (data: Object) => this.setHostName(data),
        error => this.handleNoHostnameAPI(error)
      );
  }
  public setHostName(data: Object) {
    if (data['hostname']) {
      this.hostName = data['hostname'];
    }
    this.emitChange({ hostname: this.hostName });
  }
  handleNoHostnameAPI(error) {
    console.log('no UTapi running on');
    console.log(error);
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
    }
  }
  prometheusTestFailure(error) {
    // console.log('no prometheus found on endpoint');
    // console.log(error);
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
