import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { HelperFunctionsService } from 'app/core/helper-functions.service';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';
import { GlobalSettingsService } from '../../../core/global-settings.service';
import { LocalStorageService } from '../../../core/local-storage.service';

@Component({
  selector: 'app-influxsettings',
  templateUrl: './influxsettings.component.html',
  styleUrls: ['./influxsettings.component.scss'],
})
export class InfluxsettingsComponent implements OnInit, OnDestroy {
  dbname = '';
  username = '';
  password = '';
  queryRunning = false;

  note = '';
  errortext = '';

  hidepw = true;

  databases = [];
  constructor(
    public gss: GlobalSettingsService,
    private localStorage: LocalStorageService,
    public fb: UntypedFormBuilder,
    private utHTTP: UtFetchdataService,
    private h: HelperFunctionsService
  ) {}

  myDBs = this.fb.group({
    databasesForm: ['', [Validators.required]],
  });
  changeDB(e) {
    // console.log(e);
    console.log('old:', this.dbname, 'new:', this.myDBs.value['databasesForm']);
    this.dbname = this.myDBs.value['databasesForm'];

    this.localStorage.set('influxdb', this.dbname);
    this.gss.server.influxdb = this.dbname;
    this.gss.triggerDBScan()
    // alert(this.myDBs.value['databasesForm']);
  }

  ngOnInit() {
    const lsuser = this.localStorage.get('influxuser');
    if (lsuser) {
      this.username = lsuser;
    }
    const lspw = this.localStorage.get('influxpass');
    if (lspw) {
      this.password = lspw;
    }
    if (lsuser && lspw) {
      this.login();
    }
    this.dbname = this.gss.server.influxdb;
  }

  login() {
    this.queryRunning = true;
    this.note = 'Login in Progress...';
    this.errortext = '';
    this.utHTTP
      .getHTTPData(
        this.gss.server.baseurl + '/influxdb/query?q=show databases',
        this.username,
        this.password,
        true
      )
      .subscribe(
        (data: Object) => this.handleDBlist(data),
        (error) => {
          this.note = '';
          this.queryRunning = false;

          if (error['error'] && error.error['error']) {
            this.errortext = error.error.error;
          } else {
            this.errortext = error['statusText'];
          }
          console.error(error);

          // alert(
          //   `HTTP error: ${error.status}, ${error.statusText}, ${error.message}`
          // );
        }
      );
  }
  handleDBlist(data: Object) {
    this.note = 'Authentication successful';
    this.queryRunning = false;
    console.log(data);
    const values = this.h.getDeep(data, ['results', 0, 'series', 0, 'values']);
    this.databases = [];
    for (let i = 0; i < values.length; i++) {
      this.databases.push(values[i][0]);
    }
    this.databases.sort();
    this.gss.server.influxuser = this.username;
    this.gss.server.influxpass = this.password;
    this.localStorage.set('influxuser', this.username);
    this.localStorage.set('influxpass', this.password);
  }

  ngOnDestroy() {
    // this.saveSettings();
  }
  saveSettings() {
    if(this.dbname) {
      this.localStorage.set('influxdb', this.dbname);
      this.gss.server.influxdb = this.dbname;
    }
    if (this.username) {
      this.localStorage.set('influxuser', this.username);
      this.gss.server.influxuser = this.username;
    }
    if (this.password) {
      this.localStorage.set('influxpass', this.password);
      this.gss.server.influxpass = this.password;
    }

  }
  /*
  where do we have noauth & telegraf?


  How to Choose DB?
  if only one (telegraf) -> choose this
  if more than one, choose none at first

  supply user/pass & choose DB


  UI:
  Fields user/pass
  */
}
