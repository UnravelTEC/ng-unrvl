import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';
import { HelperFunctionsService } from '../../core/helper-functions.service';
import { cloneDeep } from 'lodash-es';
import { log } from 'util';

@Component({
  selector: 'app-influx-test',
  templateUrl: './influx-test.component.html',
  styleUrls: ['./influx-test.component.scss']
})
export class InfluxTestComponent implements OnInit {
  influxresponse: String;
  influxquery: String;
  labelstrings: String[];

  extraDyGraphConfig = { connectSeparatedPoints: true, pointSize: 3 };

  public sensorData = {};
  public sensorDataExample = {
    myBME: {
      temperature: {
        tags: { id: '0x77' },
        values: {
          sensor_degC: 25.5
        }
      },

      pressure: {
        index: {
          value: 900,
          tags: { id: '0x77' }
        }
      },
      humidity: {
        index: {
          value: 42,
          tags: { id: '0x77' }
        }
      }
    }
  };
  public;

  public dygLabels = ['Date', 'sensor1-val1']; // , 'sensor2-val1', 'sensor2-val2'];
  public row1 = [new Date(new Date().valueOf() - 300100), 1]; //, null, null];
  public row2 = [new Date(new Date().valueOf() - 200000), 2]; // null, 1.2, 0.8];
  public row3 = [new Date(new Date().valueOf() - 100000), 2, null, null];
  public row4 = [new Date(), null, 2.2, 1.1];

  public dygData = [this.row1, this.row2]; // , this.row3, this.row4];
  dygDataStr = '';

  changeTrigger = true;

  constructor(
    private globalSettings: GlobalSettingsService,
    private h: HelperFunctionsService,
    private utHTTP: UtFetchdataService
  ) {
    this.globalSettings.emitChange({ appName: 'influx-test' });
    // this.row2[2] = 1.2;
    // this.row2[3] = 0.8;
    // this.row4[2] = 2.2;
    // this.row4[3] = 1.1;
    this.dygDataStr = JSON.stringify(this.dygData);
  }
  ngOnInit() {
    //let call = 'http://' + this.globalSettings.getHostName() + '.lan:8086/ping';
    let q: String;
    q = 'SELECT * FROM "temperature" LIMIT 3';
    q = 'SELECT LAST(sensor_degC),* FROM "temperature" GROUP BY *';
    q = 'SELECT LAST(gamma_cps),* FROM "radiation" GROUP BY *';
    q = 'SELECT * FROM "temperature" WHERE time > now() - 1m GROUP BY *';
    q = 'SELECT * FROM "temperature" LIMIT 3';
    q = 'SELECT LAST(*) FROM "temperature" GROUP BY *';
    q = 'SELECT * FROM temperature WHERE time > now() - 400s GROUP BY *;';

    let server = this.globalSettings.server.baseurl;
    server = server.replace(/:80$/, '');
    server = server.replace(/:443$/, '');

    let call = server + '/influxdb/query?db=telegraf&epoch=ms&q=' + q;
    console.log('calling', call);
    this.influxquery = call;

    this.utHTTP
      .getHTTPData(call)
      .subscribe((data: Object) => this.printResult(data));

    console.log('baseurl:', this.globalSettings.server.baseurl);

    console.log(server);

    // this.changeTrigger = !this.changeTrigger;
  }

  printResult(data: Object) {
    console.log(data);
    const dataarray = this.h.getDeep(data, ['results', 0, 'series']);

    // this.dygData;
    // this.dygLabels;

    const labels = ['Date'];
    if (!dataarray) {
      console.log('no data');
      return;
    }
    let validColCount = 0;
    const seriesValidColumns = [];
    const newData = [];
    for (let i = 0; i < dataarray.length; i++) {
      const series = dataarray[i];

      let tags = {};
      for (const tkey in series['tags']) {
        if (series['tags'].hasOwnProperty(tkey)) {
          const tval = series['tags'][tkey];
          if (tval) {
            tags[tkey] = tval;
          }
        }
      }
      // tags['__metric__'] = series['name']
      let serieslabel = series['name'];
      for (const tkey in tags) {
        if (tags.hasOwnProperty(tkey) && tkey != 'topic') {
          const tval = tags[tkey];
          serieslabel += ' ' + tkey + ':' + tval + ',';
        }
      }

      seriesValidColumns[i] = [];
      for (let colindex = 1; colindex < series['columns'].length; colindex++) {
        // [0]: Date
        let empty = true;
        // check if row !empty
        for (let rowindex = 0; rowindex < series['values'].length; rowindex++) {
          const value = series['values'][rowindex][colindex];
          if (value !== null) {
            empty = false;
            break;
          }
        }
        if (!empty) {
          validColCount += 1;
          seriesValidColumns[i][colindex] = validColCount; // where should it be in the end
          const colname = series['columns'][colindex];
          const collabel = serieslabel + ' ' + colname;
          labels.push(collabel);
        } else {
          seriesValidColumns[i][colindex] = false;
        }
      }
    }
    // fill data
    for (let seriesI = 0; seriesI < seriesValidColumns.length; seriesI++) {
      const series = seriesValidColumns[seriesI];
      if (!series.length) {
        console.log('series', seriesI, 'invalid');
        continue;
      }
      let validColIndices = [];
      for (let colindex = 1; colindex < series.length; colindex++) {
        // [0]: Date
        const finalColNr = series[colindex];
        if (finalColNr === false) {
          console.log('col', colindex, 'empty');
          continue;
        }
        console.log('col', colindex, 'valid, into', finalColNr);
        validColIndices.push({ from: colindex, to: finalColNr });
      }
      const seriesValues = dataarray[seriesI]['values'];

      for (let ri = 0; ri < seriesValues.length; ri++) {
        const row = seriesValues[ri];
        const newRow = [];
        newRow[0] = new Date(row[0]); // Date
        for (let ni = 0; ni < validColCount; ni++) {
          newRow.push(null);
        }
        // newRow.concat(new Array(validColCount).fill(null));
        for (let c = 0; c < validColIndices.length; c++) {
          const colInfo = validColIndices[c];
          newRow[colInfo.to] = row[colInfo.from];
        }
        newData.push(newRow);
      }
    }
    this.labelstrings = labels;

    console.log(cloneDeep(this.dygLabels));
    // this.dygLabels = labels;
    for (let i = 0; i < labels.length; i++) {
      this.dygLabels[i] = labels[i];
    }
    console.log(cloneDeep(this.dygLabels));
    console.log(cloneDeep(this.dygData));
    this.dygData = newData;
    console.log(cloneDeep(this.dygData));

    // this.changeTrigger = !this.changeTrigger;

    if (dataarray && dataarray.length) {
      const dataset = dataarray[0];
      const metric = dataset.name;

      this.influxresponse =
        'metric: ' + metric + '\n' + JSON.stringify(data, undefined, 2);
    }
  }
}
