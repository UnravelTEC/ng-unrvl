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

  public defaultPrometheusPath = '/prometheus/api/v1/';
  public defaultPrometheusPort = undefined; // '9090'; // later switch to default port
  private defaultAPIPath = '/api/';
  private fallbackEndpoint = 'https://scpexploratory02.tugraz.at/';
  private fallbackPrometheusEndpoint =
    this.fallbackEndpoint + 'prometheus/api/v1/';
  private fallbackAPI = this.fallbackEndpoint + 'api/';

  public server = {
    baseurl: '',
    architecture: undefined,
    type: 'unknown', // Tricorder || PublicServer
    hostname: 'uninitialized',
    hasscreen: undefined, // true || false
    cpu: 'unknown',
    cpus: 0,
    sensors: [],
    prometheus: undefined, // true || false
    api: undefined
  };
  public client = {
    type: 'unknown', // local || web
    protocol: 'unknown' // http || https
  };

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
    this.reloadSettings();
  }

  reloadSettings() {
    const localStoredServer = this.getPrometheusServerFromLocalStorage();
    if (localStoredServer) {
      const API = localStoredServer + this.defaultAPIPath;
      this.fetchHostName(API);
      this.getCPUinfo(API);
      this.getScreen(API);
      console.log('reloadSettings: got', API, 'from LocalStorage');
    } else {
      const firstURL = this.h.getBaseURL();
      console.log('No saved settings in LocalStorage, try server',firstURL);
      const prometheusTestQuery = 'query?query=scrape_samples_scraped';
      this.http
        .get(firstURL + this.defaultPrometheusPath + prometheusTestQuery)
        .subscribe(
          (data: Object) => {
            this.checkPrometheusTestResponse(data, firstURL);
          },
          error => {
            console.log(
              'no prometheus found on ',
              firstURL,
              ', fallback:',
              this.fallbackEndpoint
            );
            this.http
              .get(this.fallbackPrometheusEndpoint + prometheusTestQuery)
              .subscribe(
                (data: Object) => {
                  this.checkPrometheusTestResponse(data, this.fallbackEndpoint);
                },
                error => {
                  console.log('no prometheus found on', this.fallbackEndpoint);
                  this.server.prometheus = false;
                  this.server.baseurl = undefined;
                }
              );
          }
        );
    }
  }
  dummy() {
    // first: test on this.h.getBaseURL()
    // if no api or prometheus there, set server.api / prometheus to false
    // from there on, getPrometheusEndpoint() returns fallback

    const prometheus = this.getPrometheusEndpoint();

    //const baseurl = this.h.getBaseURL();
    //this.client.baseurl = baseurl;
    console.log('GlobalSettingsDervice: startup on', prometheus);
    this.testPrometheusOnEndpoint(prometheus);

    let API = this.getAPIEndpoint();
    if (!API) {
      API = this.h.getBaseURL() + '/api/';
    }

    // fill our information
    // Tricorder | Pubserver
    // tricorder: Prometheus on ARM
  }

  checkPrometheusTestResponse(data: Object, endpoint: string) {
    if (data['status'] && data['status'] === 'success') {
      console.log('SUCCESS: prometheus found on endpoint', endpoint);
      this.server.prometheus = true;
      this.server.baseurl = endpoint;
      this.fetchHostName(endpoint);
      this.getCPUinfo(endpoint);
    } else {
      console.error('FAILURE: prometheus on endpoint not ready', endpoint);
    }
  }


  getCPUinfo(endpoint) {
    this.http.get(endpoint + 'system/cpuinfo.php').subscribe(
      (data: Object) => {
        console.log('getCPUinfo got', data);
        this.server.architecture = data['architecture'];
        this.server.cpu = data['cpu'];
        this.server.cpus = data['cpus'];
        this.checkIfTricorder();
      },
      error => {
        console.log('no cpuinfo from api');
        this.server.architecture = 'unknown';
        this.server.cpu = 'unknown';
        this.server.cpus = undefined;
        this.checkIfTricorder();
      }
    );
  }
  getScreen(endpoint) {
    this.http.get(endpoint + 'screen/getBrightness.php').subscribe(
      (data: Object) => {
        if (data && data['brightness']) {
          this.server.hasscreen = true;

          if (endpoint.startsWith('http://localhost')) {
            console.log('we are on a Raspi with Raspi-Display!');
            this.client.type = 'local';
          } else {
            console.log('running on localhost without Rpi -> Developing');
            this.client.type = 'web';
          }
        }
      },
      error => {
        console.log('no raspi screen -> web client');
        this.client.type = 'web';
      }
    );
  }

  private fetchHostName(server: string) {
    // if (
    //   server.startsWith(this.h.getBaseURL()) &&
    //   this.getPrometheusEndpoint() == this.fallbackPrometheusEndpoint
    // ) {
    //   server = this.fallbackAPI;
    // }
    this.http.get(server + 'system/hostname.php').subscribe(
      (data: Object) => this.setHostName(data),
      error => {
        console.log('no UTapi running on');
        console.log(error);
        this.server.api = false;
        this.hostName = 'unknown';
        this.emitChange({ hostname: this.hostName });
      }
    );
  }
  public setHostName(data: Object) {
    if (data['hostname']) {
      this.hostName = data['hostname'];
      this.server.api = true;
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
    console.log('testing prometheus on', endpoint);
    this.http
      .get(endpoint + 'query?query=scrape_samples_scraped')
      .subscribe(
        (data: Object) => this.prometheusTestSuccess(data),
        error => this.prometheusTestFailure(error)
      );
  }
  prometheusTestSuccess(data: Object) {
    console.log('prometheus test:', data);

    if (data['status'] && data['status'] === 'success') {
      console.log('SUCCESS: prometheus found on endpoint');
      this.server.prometheus = true;
      this.checkIfTricorder();
    } else {
      this.server.prometheus = false;
    }
  }
  prometheusTestFailure(error) {
    this.server.prometheus = false;
    this.checkIfTricorder();
    // console.log('no prometheus found on endpoint');
    // console.log(error);
    true;
  }

  checkIfTricorder() {
    if (
      this.server.architecture === undefined ||
      this.server.prometheus === undefined
    ) {
      console.log('not enough information to check if I am on a Tricorder');
      return;
    }
    if (
      this.server.architecture.startsWith('arm') &&
      this.server.prometheus === true
    ) {
      this.server.type = 'Tricorder';
    } else {
      this.server.type = 'PublicServer';
    }

    console.log('I am connected to a', this.server.type);
  }

  getPrometheusServerFromLocalStorage(): string {
    const localSettings = this.localStorage.get('globalSettings');
    return this.h.getDeep(localSettings, [
      'server',
      'settings',
      'serverHostName',
      'fieldValue'
    ]);
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

    if (this.server.prometheus === false) {
      return this.fallbackPrometheusEndpoint;
    } else {
      const port = this.defaultPrometheusPort
        ? ':' + this.defaultPrometheusPort
        : '';
      return this.h.getBaseURL() + port + this.defaultPrometheusPath;
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

    if (this.server.api === false) {
      return undefined;
    } else {
      return this.h.getBaseURL() + this.defaultAPIPath;
    }
  }
}
