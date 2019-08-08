import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

@Component({
  selector: 'app-influx-test',
  templateUrl: './influx-test.component.html',
  styleUrls: ['./influx-test.component.scss']
})
export class InfluxTestComponent implements OnInit {
  constructor(
    private globalSettings: GlobalSettingsService,
    private utHTTP: UtFetchdataService
  ) {
    this.globalSettings.emitChange({ appName: 'influx-test' });
  }
  ngOnInit() {
    //let call = 'http://' + this.globalSettings.getHostName() + '.lan:8086/ping';
    const q='SELECT LAST(value_1),* FROM "voltage_V" GROUP BY *'
    let call = 'http://' + this.globalSettings.getHostName() + '.lan:8086/query?db=telegraf&epoch=ms&q=' + q;
    console.log('calling', call);

    this.utHTTP
      .getHTTPData(call)
      .subscribe((data: Object) => this.printResult(data));
  }

  printResult(data: Object) {
    console.log(data);
  }
}
