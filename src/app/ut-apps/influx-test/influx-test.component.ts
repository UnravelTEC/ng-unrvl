import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../core/helper-functions.service';
import { cloneDeep } from 'lodash-es';

@Component({
  selector: 'app-influx-test',
  templateUrl: './influx-test.component.html',
  styleUrls: ['./influx-test.component.scss']
})
export class InfluxTestComponent implements OnInit {
  influxresponse: String;

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

  public dygData = [
    [new Date(new Date().valueOf() - 1000), 1],
    [new Date(), 2]
  ];
  public dygLabels = ['Date','influx'];
  changeTrigger = true;

  constructor(
    private globalSettings: GlobalSettingsService,
    private h: HelperFunctionsService,
    private utHTTP: UtFetchdataService
  ) {
    this.globalSettings.emitChange({ appName: 'influx-test' });
  }
  ngOnInit() {
    //let call = 'http://' + this.globalSettings.getHostName() + '.lan:8086/ping';
    let q: String;
    q = 'SELECT * FROM "temperature" LIMIT 3';
    q = 'SELECT LAST(sensor_degC),* FROM "temperature" GROUP BY *';
    q = 'SELECT LAST(gamma_cps),* FROM "radiation" GROUP BY *';
    q = 'SELECT * FROM "temperature" WHERE time > now() - 1m GROUP BY *';
    q = 'SELECT * FROM "temperature" LIMIT 3';
    q = 'SELECT * FROM temperature WHERE time > now() - 10s GROUP BY *;';
    q = 'SELECT LAST(*) FROM "temperature" GROUP BY *';

    let server = this.globalSettings.server.baseurl;
    server = server.replace(/:80$/, '');
    server = server.replace(/:443$/, '');

    let call = server + '/influxdb/query?db=telegraf&epoch=ms&q=' + q;
    console.log('calling', call);

    this.utHTTP
      .getHTTPData(call)
      .subscribe((data: Object) => this.printResult(data));

    console.log('baseurl:', this.globalSettings.server.baseurl);

    console.log(server);
  }

  printResult(data: Object) {
    console.log(data);
    const dataarray = this.h.getDeep(data, ['results', 0, 'series']);
    if (dataarray && dataarray.length == 1) {
      const dataset = dataarray[0];
      const metric = dataset.name;

      let cns = {}; //  column-names
      for (let colnr = 0; colnr < dataset.columns.length; colnr++) {
        const colname = dataset.columns[colnr];
        cns[colname] = colnr;
      }

      for (let i = 0; i < dataset.values.length; i++) {
        const row = dataset.values[i];
        const ts = row[cns['time']];
        row[cns['time']] = new Date(ts);
      }
      this.influxresponse =
        'metric: ' + metric + '\n' + JSON.stringify(data, undefined, 2);
      this.dygLabels = cloneDeep(dataset.columns);
      this.dygData = dataset.values;
      console.log(this.dygLabels, this.dygData);

      this.changeTrigger = !this.changeTrigger;
    } else {
      console.error('#series != 1: ', dataarray && dataarray.length);
      this.influxresponse =
        '#series != 1\n' + JSON.stringify(data, undefined, 2);
    }
  }
}
