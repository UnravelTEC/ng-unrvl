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
  private hostName = 'uninitialized';

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

  public sensorPresets = {
    DS18B20: {
      '*_degC': {
        min: -55,
        max: 125,
        resolution_b: 16,
        step: 0.0625, // 1/16°C
        round_digits: 2,
      },
    },
    BME280: {
      '*_degC': {
        round_digits: 2,
      },
      humidity_rel_percent: {
        round_digits: 0,
      },
    },
    MPU9250: {
      sensor_degC: {
        round_digits: 1,
      },
    },
    'OPC-N3': {
      sensor_degC: {
        round_digits: 1,
      },
      humidity_rel_percent: {
        round_digits: 0,
      },
      '*_ugpm3': {
        round_digits: 1,
      },
    },
    GPS: {
      lat: {
        round_digits: 7,
      },
      lon: {
        round_digits: 7,
      },
      heading_deg: {
        round_digits: 0,
      },
      height_m_sea: {
        round_digits: 0,
      },
      height_m_wgs84: {
        round_digits: 0,
      },
      sats_gps_view: {
        round_digits: 1,
      },
    },
    'NO2-B43F': {
      NO2_ppm: {
        round_digits: 4,
      },
      NO2_ugpm3: {
        round_digits: 1,
      },
      '*_degC': {
        round_digits: 1,
      },
    },
    ADS1115: {
      resolution_mV: {
        round_digits: 3,
      },
      maxrange_V: {
        round_digits: 3,
      },
      gain: {
        round_digits: 0,
      },
      averaged_count: {
        round_digits: 0,
      },
      ch12_V: {
        round_digits: 4,
      },
      ch34_V: {
        round_digits: 4,
      },
      ch1_V: {
        round_digits: 4,
      },
      ch2_V: {
        round_digits: 4,
      },
      ch3_V: {
        round_digits: 4,
      },
      ch4_V: {
        round_digits: 4,
      },
    },
    DB: {
      '*db': {
        round_digits: 0,
      },
    },
    RS04: {
      total_Svph: {
        round_digits: 10,
      },
      sensor_highvoltage_V: {
        round_digits: 1,
      },
      sensor_voltage_V: {
        round_digits: 1,
      },
      total_cps: {
        round_digits: 1,
      },
      '*_degC': {
        round_digits: 1,
      },
      sensor_current_mA: {
        round_digits: 0,
      },
    },
  };

  public defaultAPIPath = '/api/';
  private fallbackEndpoint = 'https://newton.unraveltec.com';
  private fallbackAPI = this.fallbackEndpoint + '/api/';

  public server = {
    baseurl: '',
    serverName: '', // pure IP or hostname w/o protocol/port
    protocol: 'http', // https or http
    architecture: undefined,
    type: 'unknown', // Tricorder || PublicServer
    hostname: 'uninitialized',
    hasscreen: undefined, // true || false
    cpu: 'unknown',
    cpus: 0,
    sensors: [],
    databaseStatus: 'unknown', // db status: up, down, unknown, waiting
    api: undefined,
    influxdb: 'telegraf',
    influxuser: '',
    influxpass: '',
    influxVersion: '',
  };
  public client = {
    host: '',
    hostAndPort: '',
    protocol: 'unknown', // http || https
    baseurl: '', //http[s]://host:port
    dev: undefined,

    type: 'unknown', // local || web

    mobile: false,
  };

  public networkStatus: Object;

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
    console.log('client:', this.client);
  }

  ngOnInit() {
    this.reloadSettings();

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
  }
  checkForInflux() {
    const influxServer =
      this.server.protocol + this.server.serverName + '/influxdb';
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
        setTimeout(() => {
          this.checkForInflux();
        }, 5 * 1000);
      }
    );
  }

  checkInfluxTestResponse(data: Object) {
    if (data['status'] && data['status'] === 'pass') {
      this.server.databaseStatus = 'up';

      console.log('SUCCESS: Influx health:', data);
      this.server.influxVersion = data['version'];
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

  // we do not need to handle localhost in a special case - covered by $baseurl

  // order - what is the criteria a server must met?
  // prometheus running? - yes
  // api running? - maybe
  // 1. local storage settings
  // 2. hostname of url (if api working)
  // 3. fallback to Newton

  // following use cases:
  // • developing on localhost:4200 with ng
  //   - default: connect to Newton
  //   - connect to other tricorders on demand
  // • connected to a Tricorder
  //   - via webif
  //   - on local screen (localhost)
  // • using public Webif on Newton:
  // - default: stay on newton
  // - try out switching to another server
  reloadSettings() {
    const localSettings = this.localStorage.get('globalSettings');
    const localStoredServer = this.h.getDeep(localSettings, [
      'server',
      'settings',
    ]);
    if (localStoredServer) {
      let servername = this.h.getDeep(localStoredServer, [
        'serverHostName',
        'fieldValue',
      ]);
      if (servername.endsWith('/')) {
        servername = servername.substr(0, -1);
      }

      this.server.serverName = this.stripProtPort(servername);

      const apiPath = this.defaultAPIPath;

      if (servername.search('.') > -1 && !servername.match('.[0-9]+$')) {
        this.server.protocol = 'https://';
      } else {
        this.server.protocol = 'http://';
      }
      this.server.api = this.server.protocol + this.server.serverName + apiPath;
      this.server.baseurl = this.server.protocol + servername;

      this.fetchHostName(this.server.api);
      this.getCPUinfo(this.server.api);
      this.getScreen(this.server.api);
      console.log(
        'reloadSettings: got',
        this.server.baseurl,
        'from LocalStorage'
      );
    } else {
      // see if an API i there
      const firstURL = this.h.getBaseURL();
      this.server.baseurl = firstURL;
      this.server.serverName = this.stripProtPort(firstURL);
      this.server.protocol = firstURL.startsWith('https://')
        ? 'https://'
        : 'http://';
      console.log('No settings in LocalStorage, try our webendpoint', firstURL);

      this.server.api = firstURL + this.defaultAPIPath;
      this.http
        .get(firstURL + this.defaultAPIPath + 'system/hostname.php')
        .subscribe(
          (data: Object) => {
            this.setHostName(data);

            // set screen
            this.getScreen(this.server.api);

            // check if on Raspi
            this.getCPUinfo(this.server.api);
          },
          (error) => {
            console.log('no UTapi running on', firstURL);
            console.log(error);
            this.server.api = false;
            this.hostName = 'unknown';
            this.emitChange({ hostname: this.hostName });

            //TODO set fallback!
          }
        );
    }
    this.server.influxdb = this.localStorage.get('influxdb');
    const isPublicServer = this.server.serverName.endsWith('.unraveltec.com');
    if (!this.server.influxdb) {
      // this.server.influxdb = isPublicServer ? 'public' : 'telegraf';
      this.server.influxdb = isPublicServer ? 'koffer' : 'telegraf';
    }
    this.server.influxuser = this.localStorage.get('influxuser');
    if (!this.server.influxuser && isPublicServer) {
      this.server.influxuser = 'public';
    }
    this.server.influxpass = this.localStorage.get('influxpass');
    if (!this.server.influxpass && isPublicServer) {
      this.server.influxpass = 'unravelit42.14153';
    }
    this.checkForInflux();
    if (window.location.href.search('localhost:4200') > -1) {
      this.client.type = 'dev';
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
      (error) => {
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
            this.emitChange({ TricorderLocal: true });
          } else {
            console.log('running on localhost without Rpi -> Developing');
            this.client.type = 'web';
          }
        } else {
          console.log('no screen here.');
          this.server.hasscreen = false;
          if (window.location.href.search('localhost:4200') > -1) {
            this.client.type = 'dev';
          } else {
            this.client.type = 'web';
          }
        }
      },
      (error) => {
        console.log('no raspi screen -> web client');
        if (window.location.href.search('localhost:4200') > -1) {
          this.client.type = 'dev';
        } else {
          this.client.type = 'web';
        }
      }
    );
  }

  public fetchHostName(server: string) {
    this.http.get(server + 'system/hostname.php').subscribe(
      (data: Object) => this.setHostName(data),
      (error) => {
        console.log('no UTapi running on', server);
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
    if (this.server.architecture === undefined) {
      console.log('not enough information to check if I am on a Tricorder');
      return;
    }
    if (this.server.architecture.startsWith('arm')) {
      this.server.type = 'Tricorder';
    } else {
      this.server.type = 'PublicServer';
    }

    console.log('I am connected to a', this.server.type);
  }

  getAPIEndpoint() {
    return this.server.api;
  }

  isMobile() {
    return this.client.mobile;
  }

  // FIXME a better place for this function would be nice, but depends on sensorPresets
  roundSensorValue(value, raw_label = {}) {
    return this.h.roundAccurately(value, this.getDigits(raw_label));
  }
  getDigits(raw_label) {
    if (
      raw_label &&
      raw_label.hasOwnProperty('tags') &&
      raw_label['tags'].hasOwnProperty('sensor') &&
      this.sensorPresets.hasOwnProperty(raw_label['tags']['sensor'])
    ) {
      const sensorPreset = this.sensorPresets[raw_label['tags']['sensor']];
      const field = raw_label['field'].replace(/mean_/, ''); //optionally rm influx avg prefix
      for (const physicalParam in sensorPreset) {
        if (Object.prototype.hasOwnProperty.call(sensorPreset, physicalParam)) {
          const sensorProperties = sensorPreset[physicalParam];
          if (
            sensorProperties.hasOwnProperty('round_digits') &&
            (physicalParam == field ||
              (physicalParam.startsWith('*') &&
                field.endsWith(physicalParam.slice(1))))
          ) {
            return sensorProperties['round_digits'];
          }
        }
      }
    }
    return 2;
  }
}
