import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

@Component({
  selector: 'app-flicker',
  templateUrl: './flicker.component.html',
  styleUrls: ['./flicker.component.scss']
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
      highlightCircleSize: 3
    }
  };
  changeTrigger = true;

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
    this.utHTTP
      .getHTTPData(influxquery)
      .subscribe((data: Object) => this.printResult(data));
  }
  printResult(data: Object) {
    console.log(data);
    let ret = this.utHTTP.parseInfluxData(data);

    this.dygLabels = ret['labels'];

    this.dygData = ret['data'];
  }
}
