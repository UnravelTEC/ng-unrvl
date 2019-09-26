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
  public defaultPrometheusPort = undefined; // '80'; // later switch to default port
  private defaultAPIPath = '/api/';
  private fallbackEndpoint = 'https://scpunraveltec2.tugraz.at';
  private fallbackPrometheusEndpoint =
    this.fallbackEndpoint + this.defaultPrometheusPath;
  private fallbackAPI = this.fallbackEndpoint + 'api/';

  public server = {
    baseurl: '',
    serverName: '', // pure IP or hostname w/o protocol/port
    architecture: undefined,
    type: 'unknown', // Tricorder || PublicServer
    hostname: 'uninitialized',
    hasscreen: undefined, // true || false
    cpu: 'unknown',
    cpus: 0,
    sensors: [],
    prometheus: undefined, // String
    databaseStatus: 'unknown', // db status: up, down, unknown, waiting
    api: undefined
  };
  public client = {
    type: 'unknown', // local || web
    protocol: 'unknown', // http || https
    mobile: false
  };

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
    private localStorage: LocalStorageService
  ) {
    function mobilecheck() {
      // https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
      let check = false;
      (function(a) {
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
  }

  ngOnInit() {
    this.reloadSettings();

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

  grepSDP(sdp) {
    sdp.split('\r\n').forEach(function(line) {
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
  updateLocalAddresses(addr) {

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
    // const localStoredServer = this.getPrometheusServerFromLocalStorage();
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
      servername = servername.replace(/^http[s]*:\/\//, '');
      servername = servername.replace(/:80$/, '');
      servername = servername.replace(/:443$/, '');
      this.server.serverName = servername;

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

      this.checkForPrometheus(protAndHost + prometheusPort, prometheusPath);

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
      // see if an API i there
      const firstURL = this.h.getBaseURL();
      console.log('No settings in LocalStorage, try our webendpoint', firstURL);

      this.http
        .get(firstURL + this.defaultAPIPath + 'system/hostname.php')
        .subscribe(
          (data: Object) => {
            this.server.api = firstURL + this.defaultAPIPath;

            this.setHostName(data);

            // set screen
            this.getScreen(this.server.api);

            // check if on Raspi
            this.getCPUinfo(this.server.api);

            // emit every 5s a check for prometheus
            this.checkForPrometheus(firstURL, this.defaultPrometheusPath);
          },
          error => {
            console.log('no UTapi running on', firstURL);
            console.log(error);
            this.server.api = false;
            this.hostName = 'unknown';
            this.emitChange({ hostname: this.hostName });

            //TODO set fallback!
          }
        );
    }
  }

  checkForPrometheus(baseurl, path) {
    const prometheusTestQuery = 'query?query=scrape_samples_scraped';
    this.http.get(baseurl + path + prometheusTestQuery).subscribe(
      (data: Object) => {
        this.checkPrometheusTestResponse(data, baseurl, path);
      },
      error => {
        console.log(
          'no prometheus yet there',
          baseurl + path + prometheusTestQuery,
          ', 5s to next try.'
        );
        this.server.databaseStatus = 'down';
        setTimeout(() => {
          this.checkForPrometheus(baseurl, path);
        }, 5 * 1000);
      }
    );
  }

  checkPrometheusTestResponse(data: Object, endpoint: string, endpath: string) {
    if (data['status'] && data['status'] === 'success') {
      this.server.baseurl = endpoint;
      this.server.prometheus = endpoint + endpath;
      this.server.databaseStatus = 'up';
      this.emitChange({ Prometheus: this.server.prometheus });

      console.log('SUCCESS: prometheus found on endpoint', endpoint);

      this.checkIfTricorder();
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
            this.emitChange({ TricorderLocal: true });
          } else {
            console.log('running on localhost without Rpi -> Developing');
            this.client.type = 'web';
          }
        } else {
          console.log('no screen here.');
          this.server.hasscreen = false;
          this.client.type = 'web';
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
    if (
      this.server.architecture === undefined // ||
      // this.server.prometheus === undefined
    ) {
      console.log('not enough information to check if I am on a Tricorder');
      return;
    }
    if (this.server.architecture.startsWith('arm')) {
      // && this.server.prometheus) {
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

  isMobile() {
    return this.client.mobile;
  }
}
