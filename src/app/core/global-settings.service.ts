// from https://stackoverflow.com/questions/37662456/angular-2-output-from-router-outlet

import { Injectable, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { HelperFunctionsService } from './helper-functions.service';
import { LocalStorageService } from './local-storage.service';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class GlobalSettingsService implements OnInit {
  public graphBackgrounds = {
    CO2_ppm: [
      // the color acts for "everything below $value"
      [0.01, 'white'], // first one not used
      [500, 'rgba(0, 128, 0, 0.678)'], // green
      [800, 'rgba(0, 128, 0, 0.35)'], // light green
      [1400, 'rgba(255, 255, 0, 0.35)'], // yellow
      [2500, 'rgba(255, 166, 0, 0.35)'], // orange
      [20000, 'rgba(255, 0, 0, 0.35)'], // red
    ],
    VOC_ppm: [
      // the color acts for "everything below $value"
      [0.0001, 'white'], // first one not used
      [0.06, 'rgba(0, 128, 0, 0.678)'], // green
      [0.2, 'rgba(0, 128, 0, 0.35)'], // light green
      [0.6, 'rgba(255, 255, 0, 0.35)'], // yellow
      [2, 'rgba(255, 166, 0, 0.35)'], // orange
      [2000, 'rgba(255, 0, 0, 0.35)'], // red
    ],
    PM_ugpm3: [
      [0.01, 'white'],
      [25, 'rgba(0, 128, 0, 0.678)'], // green
      [50, 'rgba(0, 128, 0, 0.35)'], // light green
      [100, 'rgba(255, 255, 0, 0.35)'], // yellow
      [250, 'rgba(255, 166, 0, 0.35)'], // orange
      [50000, 'rgba(255, 0, 0, 0.35)'], // red
    ],
    NO2_ugpm3: [
      [0.01, 'white'],
      [40, 'rgba(0, 128, 0, 0.678)'], // green Jahresgrenzwert
      [80, 'rgba(0, 128, 0, 0.35)'], // light green Vorsorgegrenzwert 60-Minuten-Mittelwert
      [200, 'rgba(255, 255, 0, 0.35)'], // yellow 1h-Mittel-Grenzwert Außen
      [250, 'rgba(255, 166, 0, 0.35)'], // orange 1h-Mittel Gefahrengrenzwert f Innenräume
      [400, 'rgba(255, 0, 0, 0.35)'], // red Alarmschwelle
    ],
  };

  public defaultAPIPath = '/api/';

  public server = {
    chosenBackendType: undefined, //'Demo Server', 'Current Web Endpoint', 'Other'
    baseurl: '',
    serverName: '', // pure IP or hostname w/o protocol/port
    protocol: '', // https or http
    // architecture: undefined,
    type: 'unknown', // Tricorder || PublicServer
    hostname: 'uninitialized',
    hasscreen: undefined, // true || false
    // cpu: 'unknown',
    // cpus: undefined,
    sensors: undefined, // checking for undef in html is easier than for {}
    /*
    { BME280: ['temperature', 'humidity', 'pressure']}
    new:
    {
      BME280: {
        measurements: [...],
        id: {
          'i2c-7_0x76: {
            birthdate: $Date, // from cal table (or influx setup date default)
            $fieldname: {
              cals: [[ Date, n0:number, …,  n7, 'note:text' ], […]],
              hw_recal: [[ Date, value (, -s) ], […]]
            },
            tags: {} // future use
          }
        }
      }
    }
    */
    measurements: [],
    databaseStatus: 'unknown', // db status: up, down, unknown, waiting
    api: undefined,
    influxdb: '',
    influxuser: '',
    influxpass: '',
    influxVersion: '',
  };
  public client = {
    host: '',
    hostAndPort: '',
    protocol: '', // http || https
    baseurl: '', //http[s]://host:port
    dev: undefined, // if running as ng serve (localhost:4200)

    localscreen: undefined, // true if running on Henri/Device where Browser runs on same Hardware as server
    isFullscreen: undefined,

    mobile: false,
  };

  public networkStatus: Object; // gets filled by MQTT service

  // for local javascript client IPs:
  private RTCPeerConnection =
    /*window.RTCPeerConnection ||*/ window['webkitRTCPeerConnection'] ||
    window['mozRTCPeerConnection'];

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
    private localStorage: LocalStorageService,
    private loc: Location
  ) {
    function mobilecheck() {
      // https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
      let check = false;
      (function (a) {
        if (
          /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
            // tslint:disable-line
            a
          ) ||
          /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
            // tslint:disable-line
            a.substr(0, 4)
          )
        ) {
          check = true;
        }
      })(navigator.userAgent || navigator.vendor || window['opera']);
      return check;
    }
    this.client.mobile = mobilecheck();

    const url = window.location.href;
    const angularRoute = this.loc.path();
    this.client.baseurl = url.replace(angularRoute, '').replace(/\/$/, '');
    this.client.protocol = this.client.baseurl.replace(/:\/\/.*$/, '');
    this.client.hostAndPort = this.client.baseurl.replace(/^http[s]*:\/\//, '');
    this.client.host = this.client.hostAndPort.replace(/:\d+$/, '');
    this.client.dev = this.client.hostAndPort == 'localhost:4200';
    this.client.localscreen = this.client.hostAndPort == 'localhost';
    console.log('client:', this.client);
  }

  ngOnInit() {
    // gets called in /app.component.ts
    if (this.client.localscreen) {
      this.emitChange({ TricorderLocal: true });
    }

    // for local javascript client IPs:
    // if (this.RTCPeerConnection) {
    //   var rtc = new RTCPeerConnection({ iceServers: [] });
    //   if (1 || window['mozRTCPeerConnection']) {
    //     // FF [and now Chrome!] needs a channel/stream to proceed
    //     rtc.createDataChannel('', { reliable: false });
    //   }

    //   rtc.onicecandidate = function(evt) {
    //     // convert the candidate to SDP so we can run it through our general parser
    //     // see https://twitter.com/lancestout/status/525796175425720320 for details
    //     if (evt.candidate) {this.grepSDP('a=' + evt.candidate.candidate)};
    //   };
    //   rtc.createOffer(
    //     function(offerDesc) {
    //       this.grepSDP(offerDesc.sdp);
    //       rtc.setLocalDescription(offerDesc);
    //     },
    //     function(e) {
    //       console.warn('offer failed', e);
    //     }
    //   );
    // } else {
    //   console.error(
    //     'error in getLocalIPs: RTCPeerConnection could not be created'
    //   );
    // }
    const chosenBackendType = this.localStorage.get(
      'GlobalSettings.chosenBackendType'
    );
    const customServerURL = this.localStorage.get(
      'GlobalSettings.customServerURL'
    );
    if (chosenBackendType) {
      // something already in LS
      this.setCurrentWebEndpoint(chosenBackendType, customServerURL);
      // what todo if setting no longer correct?
      // -> Do nothing atm, API can be seen in Top-Bar
    } else {
      if (this.client.dev) {
        this.setCurrentWebEndpoint('Demo Server');
      } else {
        this.setCurrentWebEndpoint('Current Web Endpoint');
      }
    }
    this.checkFullscreen();
  }
  initializeInfluxCreds() {
    if (this.server.protocol == 'http') {
      this.server.influxdb = 'telegraf';
      this.server.influxuser = '';
      this.server.influxpass = '';
      console.log(
        'initializeInfluxCreds: http -> no auth, db',
        this.server.influxdb
      );
      this.triggerDBScan();
      return;
    }
    const lsinfluxdb = this.localStorage.get('influxdb');
    const lsinfluxuser = this.localStorage.get('influxuser');
    const lsinfluxpass = this.localStorage.get('influxpass');
    if (lsinfluxdb && lsinfluxuser && lsinfluxpass) {
      this.server.influxdb = lsinfluxdb;
      this.server.influxuser = lsinfluxuser;
      this.server.influxpass = lsinfluxpass;
      console.log(
        'initializeInfluxCreds from localStorage:',
        lsinfluxdb,
        lsinfluxuser,
        lsinfluxpass
      );
      this.triggerDBScan();
      return;
    }
    if (this.server.type == 'PublicServer') {
      this.server.influxdb = 'koffer';
      this.server.influxuser = 'public';
      this.server.influxpass = 'unravelit42.14153';
      console.log('initializeInfluxCreds to', this.server.influxdb);
    } else {
      console.error('initializeInfluxCreds ??');
    }
    this.triggerDBScan();
  }
  public triggerDBScan() {
    // gets sent to root app.component, who fetches sensorlist (avoid cyclic dependency with uthttp)
    this.emitChange({ InfluxUP: true });
  }
  public handleInfluxSeries(data: Object) {
    // console.log('received', data);
    const series = this.h.getDeep(data, ['results', 0, 'series', 0, 'values']);
    console.log('series', series);
    this.server.measurements = [];
    this.server.sensors = {};
    let sensorhere = false;
    for (let i = 0; i < series.length; i++) {
      const seri = series[i][0];
      const measurement = seri.split(',')[0];
      if (!this.server.measurements.includes(measurement)) {
        this.server.measurements.push(measurement);
      }
      const sensor = seri.match(/sensor=([-A-Za-z0-9|]*)/);
      if (sensor && sensor[1]) {
        sensorhere = true;
        const sname = sensor[1];
        if (!this.server.sensors[sname]) this.server.sensors[sname] = {};
        if (!this.server.sensors[sname].hasOwnProperty('measurements'))
          this.server.sensors[sname]['measurements'] = [];
        if (!this.server.sensors[sname]['measurements'].includes(measurement))
          this.server.sensors[sname]['measurements'].push(measurement);
        if (!this.server.sensors[sname].hasOwnProperty('id')) this.server.sensors[sname]['id'] = {};
        const id = seri.match(/id=([-A-Za-z0-9|_/]*)/);
        if (id && id[1]) {
          const sid = id[1]
          if (!this.server.sensors[sname]['id'].hasOwnProperty(sid))
            this.server.sensors[sname]['id'][sid] = {}
        }

      }
      // const host = seri.match(/host=([-A-Za-z0-9]*)/);
      // if (host && host[1] && !this.hosts.includes(host[1])) {
      //   this.hosts.push(host[1]);
      // }
    }
    if (!sensorhere) {
      this.server.sensors = undefined; // checking for undef in html is easier than for {}
    }
    console.log('measurements:', this.server.measurements);
    console.log('sensors:', this.server.sensors);
  }
  setCurrentWebEndpoint(chosenBackendType, baseurl?: string) {
    switch (chosenBackendType) {
      case 'Current Web Endpoint':
        this.server.baseurl = this.client.baseurl;
        break;
      case 'Demo Server':
        this.server.baseurl = 'https://newton.unraveltec.com';
        this.server.hasscreen = false;
        break;
      case 'Other':
        if (!baseurl) {
          console.error('setCurrentWebEndpoint: no baseurl provided');
          return;
        }
        this.server.baseurl = baseurl;
        this.localStorage.set('GlobalSettings.customServerURL', baseurl);
        break;
      default:
        console.error('setCurrentWebEndpoint ??');
        return;
    }
    this.server.chosenBackendType = chosenBackendType;
    this.server.protocol = this.server.baseurl.replace(/:\/\/.*$/, '');
    this.server.serverName = this.server.baseurl
      .replace(/^http[s]*:\/\//, '')
      .replace(/:\d+$/, '');
    this.server.type =
      this.server.protocol == 'https' ? 'PublicServer' : 'Tricorder';
    this.server.api = this.server.baseurl + this.defaultAPIPath;

    if (chosenBackendType != 'Demo Server') {
      this.getScreen();
    }

    this.server.hostname = 'uninitialized';
    this.fetchHostName();

    this.localStorage.set(
      'GlobalSettings.chosenBackendType',
      chosenBackendType
    );
    console.log('setCurrentWebEndpoint', chosenBackendType, this.server);
    this.checkForInfluxCounter = 0;
    this.checkForInflux();
  }

  private checkForInfluxCounter = 0;
  checkForInflux() {
    const influxServer = this.server.baseurl + '/influxdb';
    const InfluxHealthQuery = '/health';
    this.http.get(influxServer + InfluxHealthQuery).subscribe(
      (data: Object) => {
        this.checkInfluxTestResponse(data);
      },
      (error) => {
        console.log(
          'no Influx yet there',
          influxServer + InfluxHealthQuery,
          ', 5s to next try.'
        );
        this.server.databaseStatus = 'down';
        this.checkForInfluxCounter++;
        if (this.checkForInfluxCounter < 5) {
          setTimeout(() => {
            this.checkForInflux();
          }, 5 * 1000);
        }
      }
    );
  }

  checkInfluxTestResponse(data: Object) {
    if (data['status'] && data['status'] === 'pass') {
      this.server.databaseStatus = 'up';
      this.checkForInfluxCounter = 0;

      console.log('SUCCESS: Influx health:', data);
      this.server.influxVersion = data['version'];
      this.initializeInfluxCreds();
    } else {
      console.error('FAILURE: Influx on endpoint not ready', data);
    }
  }

  grepSDP(sdp) {
    sdp.split('\r\n').forEach(function (line) {
      // c.f. http://tools.ietf.org/html/rfc4566#page-39
      if (~line.indexOf('a=candidate')) {
        // http://tools.ietf.org/html/rfc4566#section-5.13
        var parts = line.split(' '), // http://tools.ietf.org/html/rfc5245#section-15.1
          addr = parts[4],
          type = parts[7];
        if (type === 'host') this.updateLocalAddresses(addr);
      } else if (~line.indexOf('c=')) {
        // http://tools.ietf.org/html/rfc4566#section-5.7
        var parts = line.split(' '),
          addr = parts[2];
        this.updateLocalAddresses(addr);
      }
    });
  }
  updateLocalAddresses(addr) {}

  stripProtPort(input: string) {
    input = input.replace(/^http[s]*:\/\//, '');
    input = input.replace(/:\d+$/, '');
    input = input.replace(/\/$/, '');
    return input;
  }

  // getCPUinfo(endpoint) {
  //   this.http.get(endpoint + 'system/cpuinfo.php').subscribe(
  //     (data: Object) => {
  //       console.log('getCPUinfo got', data);
  //       this.server.architecture = data['architecture'];
  //       this.server.cpu = data['cpu'];
  //       this.server.cpus = data['cpus'];
  //     },
  //     (error) => {
  //       console.log('no cpuinfo from api');
  //       this.server.architecture = 'unknown';
  //       this.server.cpu = 'unknown';
  //       this.server.cpus = undefined;
  //     }
  //   );
  // }
  getScreen(api = this.server.api) {
    this.server.hasscreen = undefined;
    this.http.get(api + 'screen/getBrightness.php').subscribe(
      (data: Object) => {
        if (data && data['brightness']) {
          console.log('api says server has a Raspi screen');
          this.server.hasscreen = true;
        } else {
          console.log('api says no Raspi screen here.');
          this.server.hasscreen = false;
        }
      },
      (error) => {
        console.log('no screen api');
        this.server.hasscreen = false;
      }
    );
  }

  public fetchHostName(api = this.server.api) {
    if (!api) {
      console.error('fetchHostName: no api', api);
      return;
    }
    this.http.get(api + 'system/hostname.php').subscribe(
      (data: Object) => this.setHostName(data),
      (error) => {
        console.log('no UTapi running on', api);
        console.log(error);
        this.server.api = false;
        this.server.hostname = 'unknown';
        this.emitChange({ hostname: this.server.hostname });
      }
    );
  }
  public setHostName(data: Object) {
    if (data['hostname']) {
      this.server.hostname = data['hostname'];
    } else {
      console.error('hostname cmd returned no hostname');
      this.server.hostname = 'undefined';
    }

    this.emitChange({ hostname: this.server.hostname });
  }

  getAPIEndpoint() {
    return this.server.api;
  }

  isMobile() {
    return this.client.mobile;
  }

  checkFullscreen() {
    this.client.isFullscreen =
      document['fullscreenElement'] && document['fullscreenElement'] !== null;
  }
  fullscreen() {
    // https://stackoverflow.com/questions/36672561/how-to-exit-fullscreen-onclick-using-javascript
    const isInFullScreen = this.client.isFullscreen;
    /*||
        (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
        (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
        (document.msFullscreenElement && document.msFullscreenElement !== null); */

    const docElm = document.documentElement;
    if (!isInFullScreen) {
      if (docElm.requestFullscreen) {
        docElm.requestFullscreen();
        this.client.isFullscreen = true;
      } /* else if (docElm.mozRequestFullScreen) {
            docElm.mozRequestFullScreen();
        } else if (docElm.webkitRequestFullScreen) {
            docElm.webkitRequestFullScreen();
        } else if (docElm.msRequestFullscreen) {
            docElm.msRequestFullscreen();
        } */
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        this.client.isFullscreen = false;
      } /* else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } */
    }
  }
}
