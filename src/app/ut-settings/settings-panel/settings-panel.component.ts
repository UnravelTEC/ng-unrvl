import { Component, OnInit } from "@angular/core";
import { LocalStorageService } from "../../core/local-storage.service";
import { HelperFunctionsService } from "../../core/helper-functions.service";
import { GlobalSettingsService } from "../../core/global-settings.service";
import { UtFetchdataService } from "../../shared/ut-fetchdata.service";
import { MqttService } from "../../core/mqtt.service";
import { gitVersion } from "../../../environments/git-version";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: "app-settings-panel",
  templateUrl: "./settings-panel.component.html",
  styleUrls: ["./settings-panel.component.scss"],
})
export class SettingsPanelComponent implements OnInit {
  debug = true;
  gitV = gitVersion;

  public currentBrightness = 0;

  public uv4lPath = "";

  public api_username = "system";
  public api_pass = "";
  public login_status_text = "Not logged in.";
  public auth = "NOK";
  public hidepw = true;

  public newHostname = "";

  public backendTypes = ["Demo Server", "Current Web Endpoint", "Other"];
  public chosenBackendType = "";
  public customServerURL = "https://example.com";
  public checkedCustomServerURL = "";

  public retentionTime = "";
  public retentionTimeD = "";
  public retentionTimeW = "";
  public userRetentionValue = 0;
  public userRetentionUnit = "w";
  public tempoRes = "";
  public userTempores = "";

  // public InternetServers = [
  //   {
  //     url: 'https://newton.unraveltec.com',
  //     name: 'UnravelTEC Demo Server',
  //   },
  //   // TODO handle custom
  // ];

  currentSettings = {
    // -> later into globalsettings?
    baseurl: "",
    influxdb: "",
    influxuser: "",
    influxpass: "",
  };
  defaultsInfluxcreds: {
    "https://*unraveltec.com": {
      db: "koffer";
      user: "public";
      pass: "unravelit42.14153";
    };
    localhost: {
      db: "telegraf";
      user: "";
      pass: "";
    };
    LAN: {
      db: "telegraf";
      user: "";
      pass: "";
    };
  };

  /*
  Cases:
    - dev (localhost:4200) -> zwingend other host, default Newton:Koffer
    - Local Screen (localhost) - show only if url: localhost?
    - internet server (https://...)
      - Newton or more?
    - LAN (http://...)
      - LAN device DB
      - others - discover?

  browserurl:
    - https:// -> newton, ngbeta, ... => 'Current Web Endpoint'
    - http://localhost -> Henri Screen =>  'Current Web Endpoint'
    - http://localhost:4200 -> Dev => 'Demo Server'
    - http://192.* -> Ampel, Bimbox, Tinylogger =>  'Current Web Endpoint'

  serverurls:
    - http://localhost -> Henri (show only if http://localhost)
    - Demo: https://newton
    - http://192... (or other https )

  Options to Choose (old)
    - internet server
       ... möglichkeit zum querien von Standard Influx (port 8xxx) bieten, nicht nur hinter apache proxy?
    - Local Screen -> derzeit nichts zum wechseln, use case net da.
      - naja Demo-Server schon, da man ev. Sensoren herzeigen will die Henri net hat?
    - LAN (wenn lan-IP?) -> eigentlich a net zum wechseln, es hat eh jedes unserer Geräte ein UI, wenn eine Influx drauf is
      - aber für Marketingzwecke soll Demo-Server auch angewählt werden können!
    -> Choosing Server only needed for Dev!
      - und da: newton, LAN

  Für User:
    - This [device|server] (http[s]//x.x.x.x)
      - can be:
        - localhost (Henri)
        - Ampel, Tinylogger
        - newton, ngbeta, envirograz, ...
    - UnravelTEC Demo Server (only if url does not contain unraveltec)
    - Other: free (option to save custom in list)
      - free text
      - discover LAN?

  Defaults (if nothing in LS):
    - if dev -> Newton, influx public
    - everything else -> baseurl, influx telegraf

  needed saved Settings:
    - baseurl
    - influx db, user, pass (sub-app accesses gss directly!)

    influx:
      only user/pass should be supplied (or nothing)
      -> list DBs, choose DB from Dropdown, save it.

    -> here in settingspanel: if proto == http; dont display
    in globalsettings: if nothing stored for host, use telegraf if http; else unraveltec/koffer


  Check at start
    - isDev
    - hasLocalScreen
    - hasFan
    - show Login?
    - has network settings (->startswith http:// | !PublicServer)
    - show influx settings (isDev, Internet Server)

  Settings Sections
    - Backend
    - Auth
    - Brightness
    - Network
    - Fan Speed
    - System Services
    - System Time
    - Shut Down/Reboot
    - Influx
  -> New
  - Backend
    - Influx
  - If Auth
    - Network
    - Brightness, Fan Speed, System Time
    - System Services, Shut Down/Reboot

    */

  setEndpoint(event: any) {
    console.log("setEndpoint", this.chosenBackendType);

    switch (this.chosenBackendType) {
      case "Current Web Endpoint":
      case "Demo Server":
        this.gss.setCurrentWebEndpoint(this.chosenBackendType);
        this.mqtt.reload();
        break;
      case "Other":
        if (this.checkedCustomServerURL == this.customServerURL) {
          this.localStorage.set(
            "GlobalSettings.chosenBackendType",
            this.chosenBackendType
          );
        }
        break;

      default:
        console.error("??");
        break;
    }
  }
  checkCustomEndpoint() {
    ["baseurl", "protocol", "serverName", "type", "api"].forEach((element) => {
      this.gss.server[element] = "";
    });
    this.gss.server.hostname = "Unset";
    if (!this.customServerURL.startsWith("http")) {
      this.customServerURL = "http://" + this.customServerURL;
    }
    this.http
      .get(
        this.customServerURL + this.gss.defaultAPIPath + "system/hostname.php"
      )
      .subscribe(
        (data: Object) => this.setCustomEndpointCallback(data),
        (error) => this.apiError(error)
      );
  }
  setCustomEndpointCallback(data: Object) {
    if (!data["hostname"] || data["hostname"].length == 0) {
      this.apiError("no hostname in answer");
      return;
    }
    this.gss.setCurrentWebEndpoint("Other", this.customServerURL);
    this.mqtt.reload();
    this.checkedCustomServerURL = this.customServerURL;
  }

  apiError(error) {
    console.log("no UTapi running on", this.customServerURL);
    console.log(error);
    alert('no UTapi running on "' + this.customServerURL + '"');
    this.gss.emitChange({ hostname: "Unset" });
  }

  constructor(
    private localStorage: LocalStorageService,
    public gss: GlobalSettingsService,
    private utHTTP: UtFetchdataService,
    private http: HttpClient,
    public h: HelperFunctionsService,
    private mqtt: MqttService
  ) {
    // has to be here instead of ngOnInit, otherwise ExpressionChangedAfterItHasBeenCheckedError
    this.gss.emitChange({ appName: "Settings" });
  }

  ngOnInit() {
    ["chosenBackendType", "customServerURL"].forEach((element) => {
      const thing = this.localStorage.get("GlobalSettings." + element);
      if (thing !== null) {
        this[element] = thing;
      }
    });

    // if (this.chosenBackendType == 'Other') {
    //   if (this.customServerURL) {
    //     this.checkCustomEndpoint();
    //   }
    // } else if (this.chosenBackendType) {
    //   this.setEndpoint(null);
    // }

    // before, read out all localstorage items
    this.load();

    // if (this.gss.server.api) {
    //   this.uv4lPath = this.gss.server.api.replace(/\/api\/$/, '') + ':8080';
    // }
    console.log("globalSettingsService.server", this.gss.server);
    console.log("domain", this.h.domain);

    this.login();
    this.getRetentionTime();
  }

  load() {
    // console.log('globalSettingsService.client.type', this.gss.client.type);
    const ls_api_user = this.localStorage.get("api_user");
    if (ls_api_user) this.api_username = ls_api_user;
    const ls_api_pass = this.localStorage.get("api_pass");
    if (ls_api_pass) this.api_pass = ls_api_pass;
  }

  // save() {
  //   this.localStorage.set('globalSettings', this.globalSettingsUnsaved);
  //   this.globalSettings = JSON.parse(
  //     JSON.stringify(this.globalSettingsUnsaved)
  //   );
  //   // alert('save ok');
  //   this.gss.reloadSettings();
  //   this.localStoredSettings = true;
  //   this.mqtt.reload();
  //   this.API = this.gss.getAPIEndpoint();
  // }
  // reset() {
  //   this.globalSettingsUnsaved = JSON.parse(
  //     JSON.stringify(this.defaultSettings)
  //   );
  //   // alert('reset ok');
  // }
  // deleteStoredSettings() {
  //   this.localStorage.delete('globalSettings');
  //   this.gss.reloadSettings();
  // }

  login() {
    this.login_status_text = "authentication Request sent.";
    this.localStorage.set("api_user", this.api_username);
    this.localStorage.set("api_pass", this.api_pass);
    this.utHTTP
      .getHTTPData(
        this.gss.server.api + "system/auth.php",
        this.api_username,
        this.api_pass,
        true,
      )
      .subscribe(
        (data: Object) => this.acceptAuth(data),
        (error: any) => this.handleAuthError(error)
      );
  }
  acceptAuth(data: Object) {
    if (data["success"] && data["success"] === true) {
      this.login_status_text = "Authentication successful";
      this.auth = "OK";
      this.getTempoRes();
      this.getDBsize();
    } else {
      this.login_status_text = "error at authentication";
      this.auth = "NOK";
    }
    console.log("acceptAuth", data);
  }
  handleAuthError(error: any) {
    this.login_status_text = "authentication failed";
    if (error && error["statusText"]) {
      this.login_status_text += ": " + error["statusText"];
      // 500 if no htpasswd file there
    }
    this.auth = "NOK";
    console.log("auth error", error);
  }

  ack(data: Object) {
    console.log("api retval:", data);
    if (data["shutdown"]) {
      switch (data["shutdown"]) {
        case "halt":
          alert("system halted");
          break;
        case "reboot":
          alert("system rebooted");
          break;
      }
    }
    if (data["hostname"]) {
      this.gss.server.hostname = data["hostname"];
      this.gss.emitChange({ hostname: data["hostname"] });
      alert('New hostname: "' + data["hostname"] + '"');
    }
  }

  halt() {
    if (confirm("Halt now?")) {
      this.utHTTP
        .getHTTPData(
          this.gss.server.api + "system/halt.php",
          this.api_username,
          this.api_pass,
          true
        )
        .subscribe((data: Object) => this.ack(data));
    }
  }
  reboot() {
    if (confirm("Reboot now?")) {
      this.utHTTP
        .getHTTPData(
          this.gss.server.api + "system/reboot.php",
          this.api_username,
          this.api_pass,
          true
        )
        .subscribe((data: Object) => this.ack(data));
    }
  }

  setNewBN(bn) {
    this.currentBrightness = bn;
  }

  setNewHostname() {
    const newHN = this.newHostname.trim();
    if (newHN.length < 1 || newHN.length > 63) {
      alert("Hostname length has to be between 1 and 63");
      return;
    }
    if (/[^a-z0-9-]/i.test(newHN) || /^-/.test(newHN)) {
      alert(
        'Hostname can only contain a-zA-Z0-9- (not start with -), provided was "' +
        newHN +
        '"'
      );
      return;
    }
    if (confirm('Set "' + newHN + '" as new hostname?')) {
      this.utHTTP
        .getHTTPData(
          this.gss.server.api + "system/sethostname.php?hostname=" + newHN,
          this.api_username,
          this.api_pass,
          true
        )
        .subscribe(
          (data: Object) => this.ack(data),
          (error: any) => this.handleSetHostnameError(error)
        );
    }
  }
  handleSetHostnameError(error: any) {
    if (error && error["statusText"]) {
      alert(error);
      console.error("handleSetHostnameError", error);
    } else {
      console.error("unknown handleSetHostnameError", error);
    }
  }
  getRetentionTime() {
    if (!this.gss.influxReady()) {
      setTimeout(() => {
        this.getRetentionTime();
      }, 1000);
      return;
    }
    const retquery =
      'SHOW RETENTION POLICIES ON "' + this.gss.server.influxdb + '"';
    this.utHTTP.getHTTPData(this.utHTTP.buildInfluxQuery(retquery)).subscribe(
      (data: Object) => this.acceptRetention(data),
      (error) => this.gss.displayHTTPerror(error)
    );
  }
  acceptRetention(data: Object) {
    console.log("acceptRetention", data);
    this.retentionTime = this.h.getDeep(data, [
      "results",
      0,
      "series",
      0,
      "values",
      0,
      1,
    ]);
    if (this.retentionTime) {
      this.retentionTimeD = String(Number(this.retentionTime.split("h")[0]) / 24);
      this.retentionTimeW = String(Number(this.retentionTimeD) / 7);
    }
  }
  requeryRetentionTime(data: any) {
    this.getRetentionTime();
  }
  setRetentionTime() {
    if (!this.gss.influxReady()) {
      alert("Please wait for Influx ready");
      return;
    }
    const retquery =
      'ALTER RETENTION POLICY "autogen" ON "' +
      this.gss.server.influxdb +
      '" DURATION ' +
      this.userRetentionValue +
      this.userRetentionUnit +
      " REPLICATION 1 DEFAULT";
    this.utHTTP.postData(this.utHTTP.buildInfluxQuery(retquery), '',).subscribe(
      (data: Object) => this.requeryRetentionTime(data),
      (error) => this.gss.displayHTTPerror(error)
    );
  }
  getTempoRes() {
    this.utHTTP
      .getHTTPData(
        this.gss.server.api + "system/db-tempores.php",
        this.api_username,
        this.api_pass,
        true
      )
      .subscribe(
        (data: Object) => this.acceptTempoRes(data),
        (error: any) => this.gss.displayHTTPerror(error)
      );
  }
  acceptTempoRes(data: Object) {
    if (data["success"]) {
      this.tempoRes = data["precision"];
    } else {
      console.error(data);
      alert(data['error'] ? data['error'] : data);
    }
  }
  setTempoRes() {
    if (!this.userTempores) {
      alert("choose in drop down");
      return;
    }
    this.utHTTP
      .getHTTPData(
        this.gss.server.api + "system/db-tempores.php?set=" + this.userTempores,
        this.api_username,
        this.api_pass,
        true
      )
      .subscribe(
        (data: Object) => this.acceptTempoRes(data),
        (error: any) => this.gss.displayHTTPerror(error)
      );
  }

  public dbstats: Object = undefined;
  getDBsize() {
    this.utHTTP
      .getHTTPData(
        this.gss.server.api + "system/db.php?cmd=getsize",
        this.api_username,
        this.api_pass,
        true
      )
      .subscribe(
        (data: Object) => this.acceptDBsize(data),
        (error: any) => this.gss.displayHTTPerror(error)
      );
  }
  acceptDBsize(data: Object) {
    console.log("acceptDBsize", data);

    if (data["success"]) {
      this.dbstats = data['stats'];
      console.log('dbstats:', this.dbstats);

    }
  }
  wipeDB() {
    if ("YES" == prompt("are you sure to wipe the DB? Type yes in Uppercase letters")) {
      // alert("here we wipe...")
      this.utHTTP
        .getHTTPData(
          this.gss.server.api + "system/db.php?cmd=wipe",
          this.api_username,
          this.api_pass,
          true
        )
        .subscribe(
          (data: Object) => {
            this.userRetentionValue = Number(this.retentionTimeD);
            this.userRetentionUnit = 'd';
            this.setRetentionTime();
          },
          (error: any) => this.gss.displayHTTPerror(error)
        );
    }
  }
}
