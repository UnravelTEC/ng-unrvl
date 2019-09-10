import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';
import * as Paho from 'paho-mqtt';

@Component({
  selector: 'app-influx-test',
  templateUrl: './influx-test.component.html',
  styleUrls: ['./influx-test.component.scss']
})
export class InfluxTestComponent implements OnInit {
  public sensorData = {};
  public sensorDataExample = {
    myBME: {
      temperature_degC: {
        index: {
          value: 25.5,
          tags: { id: '0x77' }
        }
      },

      pressure_hPA: {
        index: {
          value: 900,
          tags: { id: '0x77' }
        }
      },
      humidity_rel_percent: {
        index: {
          value: 42,
          tags: { id: '0x77' }
        }
      }
    }
  };

  constructor(
    private globalSettings: GlobalSettingsService,
    private utHTTP: UtFetchdataService
  ) {
    this.globalSettings.emitChange({ appName: 'influx-test' });
  }
  ngOnInit() {
    //let call = 'http://' + this.globalSettings.getHostName() + '.lan:8086/ping';
    const q = 'SELECT LAST(value_1),* FROM "voltage_V" GROUP BY *';
    let call =
      'http://' +
      this.globalSettings.getHostName() +
      '.lan:8086/query?db=telegraf&epoch=ms&q=' +
      q;
    console.log('calling', call);

    this.utHTTP
      .getHTTPData(call)
      .subscribe((data: Object) => this.printResult(data));

    console.log('baseurl:', this.globalSettings.server.baseurl);
    let server = this.globalSettings.server.baseurl.replace(
      /^http[s]*:\/\//,
      ''
    );
    server = server.replace(/:80$/, '');
    server = server.replace(/:443$/, '');
    console.log(server);
  }

  printResult(data: Object) {
    console.log(data);
  }
}
