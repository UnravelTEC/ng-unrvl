import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

@Component({
  selector: 'app-flicker',
  templateUrl: './flicker.component.html',
  styleUrls: ['./flicker.component.scss'],
})
export class FlickerComponent implements OnInit {
  public dygLabels = [];
  public dygData = [];

  extraDyGraphConfig = {
    connectSeparatedPoints: true,
    pointSize: 3,
    highlightSeriesOpts: {
      strokeWidth: 1,
      strokeBorderWidth: 1,
      highlightCircleSize: 3,
    },
  };
  changeTrigger = 0;

  frequency = 0;

  public startTime = '1s';

  constructor(
    private globalSettings: GlobalSettingsService,
    private utHTTP: UtFetchdataService
  ) {
    this.globalSettings.emitChange({ appName: 'Flicker' });
  }
  ngOnInit() {
    this.launchQuery();
  }

  launchQuery() {
    // raspi4/sensors/TSL257/voltage WHERE sensor = "TSL257"
    const q =
      "SELECT voltage_V FROM voltage WHERE sensor = 'TSL257' ORDER BY time DESC LIMIT 1000;";

    const influxquery =
      'http://' +
      this.globalSettings.server.serverName +
      '/influxdb/query?db=telegraf&epoch=ms&q=' +
      q;
    this.utHTTP.getHTTPData(influxquery).subscribe(
      (data: Object) => this.printResult(data),
      (error) => this.globalSettings.displayHTTPerror(error)
    );
  }
  printResult(data: Object) {
    console.log(data);
    let ret = this.utHTTP.parseInfluxData(data);
    if (ret['error']) {
      alert('Influx Error: ' + ret['error']);
      return;
    }

    this.dygLabels = ret['labels'];

    this.dygData = ret['data'];
    const firstd = this.dygData[0][0];
    const numvalues = this.dygData.length;
    const lastd = this.dygData[numvalues - 1][0];
    const seconds = lastd.valueOf() - firstd.valueOf();
    this.frequency = numvalues / seconds;
  }
}
