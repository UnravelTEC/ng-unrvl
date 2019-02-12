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
  private fallbackEndpoint = 'https://scpexploratory02.tugraz.at';
  private fallbackPrometheusEndpoint =
    this.fallbackEndpoint + this.defaultPrometheusPath;
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
    prometheus: undefined, // String
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
  reloadSettings() {
    //const localStoredServer = this.getPrometheusServerFromLocalStorage();
    const localSettings = this.localStorage.get('globalSettings');
    const localStoredServer = this.h.getDeep(localSettings, [
      'server',
      'settings'
    ]);
    if (localStoredServer) {
      let servername = this.h.getDeep(localStoredServer, [
        'serverHostName',
        'fieldValue'
      ]);
      if (servername.endsWith('/')) {
        servername = servername.substr(0, -1);
      }
      this.server.baseurl = servername;

      let prometheusPath = this.h.getDeep(localStoredServer, [
        'prometheusPath',
        'fieldValue'
      ]);
      if (!prometheusPath) {
        prometheusPath = this.defaultPrometheusPath;
      }
      if (!prometheusPath.startsWith('/')) {
        prometheusPath = '/' + prometheusPath;
      }
      let prometheusPort = this.h.getDeep(localStoredServer, [
        'prometheusPort',
        'fieldValue'
      ]);
      prometheusPort = Number(prometheusPort) > 0 ? ':' + prometheusPort : '';

      let prometheusProtocol = this.h.getDeep(localStoredServer, [
        'prometheusProtocol',
        'fieldValue'
      ]);
      if (!prometheusProtocol) {
        prometheusProtocol = prometheusPort === ':443' ? 'https://' : 'http://';
      } else {
        if (!prometheusProtocol.endsWith('://')) {
          prometheusProtocol = prometheusProtocol + '://';
        }
      }
      let protAndHost = servername.startsWith('http')
        ? servername
        : prometheusProtocol + servername;

      this.server.prometheus = protAndHost + prometheusPort + prometheusPath;

      let apiPath = this.h.getDeep(localStoredServer, [
        'apiPath',
        'fieldValue'
      ]);
      if (!apiPath) {
        apiPath = this.defaultAPIPath;
      }
      if (!apiPath.startsWith('/')) {
        apiPath = '/' + apiPath;
      }
      let apiPort = this.h.getDeep(localStoredServer, [
        'apiPort',
        'fieldValue'
      ]);
      apiPort = Number(apiPort) > 0 ? ':' + apiPort : '';
      let apiProtocol = this.h.getDeep(localStoredServer, [
        'apiProtocol',
        'fieldValue'
      ]);
      if (!apiProtocol) {
        apiProtocol = apiPort === ':443' ? 'https://' : 'http://';
      } else {
        if (!apiProtocol.endsWith('://')) {
          apiProtocol = apiProtocol + '://';
        }
      }
      protAndHost = servername.startsWith('http')
        ? servername
        : apiProtocol + servername;

      this.server.api = protAndHost + apiPort + apiPath;

      this.fetchHostName(this.server.api);
      this.getCPUinfo(this.server.api);
      this.getScreen(this.server.api);
      console.log(
        'reloadSettings: got',
        this.server.baseurl,
        'from LocalStorage'
      );
    } else {
      const firstURL = this.h.getBaseURL();
      const prometheusTestQuery = 'query?query=scrape_samples_scraped';
      console.log(
        'No settings in LocalStorage, try our webendpoint',
        firstURL + this.defaultPrometheusPath + prometheusTestQuery
      );

      this.http
        .get(firstURL + this.defaultPrometheusPath + prometheusTestQuery)
        .subscribe(
          (data: Object) => {
            this.checkPrometheusTestResponse(
              data,
              firstURL,
              this.defaultPrometheusPath
            );
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
                  this.checkPrometheusTestResponse(
                    data,
                    this.fallbackEndpoint,
                    this.defaultPrometheusPath
                  );
                },
                error => {
                  console.log('no prometheus found on', this.fallbackEndpoint);
                  this.server.prometheus = '';
                  this.server.baseurl = undefined;
                }
              );
          }
        );
    }
  }

  checkPrometheusTestResponse(data: Object, endpoint: string, endpath: string) {
    if (data['status'] && data['status'] === 'success') {
      this.server.baseurl = endpoint;
      this.server.prometheus = endpoint + endpath;
      this.server.api = endpoint + this.defaultAPIPath;
      this.fetchHostName(this.server.api);
      this.getCPUinfo(this.server.api);
      this.getScreen(this.server.api);
      console.log('SUCCESS: prometheus found on endpoint', endpoint);
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
    } else {
      console.error('hostname cmd returned no hostname');
      this.hostName = 'undefined';
    }

    this.emitChange({ hostname: this.hostName });
  }

  public getHostName(): string {
    return this.hostName;
  }

  checkIfTricorder() {
    if (
      this.server.architecture === undefined ||
      this.server.prometheus === undefined
    ) {
      console.log('not enough information to check if I am on a Tricorder');
      return;
    }
    if (this.server.architecture.startsWith('arm') && this.server.prometheus) {
      this.server.type = 'Tricorder';
    } else {
      this.server.type = 'PublicServer';
    }

    console.log('I am connected to a', this.server.type);
  }

  getPrometheusEndpoint() {
    return this.server.prometheus;
  }

  getAPIEndpoint() {
    return this.server.api;
  }
}
