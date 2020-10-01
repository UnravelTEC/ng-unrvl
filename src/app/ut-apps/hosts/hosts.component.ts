import { Component, OnInit } from '@angular/core';
// import * as mysql from 'mysql';
import { GlobalSettingsService } from 'app/core/global-settings.service';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';
import { HelperFunctionsService } from 'app/core/helper-functions.service';

@Component({
  selector: 'app-hosts',
  templateUrl: './hosts.component.html',
  styleUrls: ['./hosts.component.css'],
})
export class HostsComponent implements OnInit {
  public API = '';

  public sqlresult: Array<any>;

  constructor(
    private globalSettings: GlobalSettingsService,
    private utHTTP: UtFetchdataService,
    private h: HelperFunctionsService
  ) {
    this.globalSettings.emitChange({ appName: 'IoT Devices' });
  }

  ngOnInit() {
    // const connection = mysql.createConnection({
    //   host: '192.168.11.163',
    //   user: 'root',
    //   password: 'jKD7ubqVeg',
    //   database: 'ntopng',
    // });

    // connection.connect();

    // connection.query(
    //   'SELECT * FROM `flowsv4` ORDER BY `LAST_SWITCHED` ASC LIMIT 25',
    //   function (error, results, fields) {
    //     if (error) throw error;
    //     console.log('The solution is: ', results[0].solution);
    //   }
    // );

    // connection.end();

    this.API = this.globalSettings.getAPIEndpoint();

    this.utHTTP
      .getHTTPData(this.API + 'sql/my.php')
      .subscribe((data: Object) => this.handleMyQuery(data));
  }
  handleMyQuery(data: Object) {
    console.log('api retval:', data);
    const newArr = [];
    const dataArr = data['result'];
    for (let i = 0; i < dataArr.length; i++) {
      const row = dataArr[i];
      row['IP_DST_ADDR_str'] = this.h.intToIPv4(row['IP_DST_ADDR']);
      row['IP_SRC_ADDR_str'] = this.h.intToIPv4(row['IP_SRC_ADDR']);
    }

    this.sqlresult = data['result'];
  }
}
