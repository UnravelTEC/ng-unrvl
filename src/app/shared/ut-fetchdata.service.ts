import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { GlobalSettingsService } from '../core/global-settings.service';
import { HelperFunctionsService } from '../core/helper-functions.service';

import { HttpHeaders } from '@angular/common/http';
import { cloneDeep } from 'lodash-es';

@Injectable({
  providedIn: 'root'
})
export class UtFetchdataService {
  constructor(
    private http: HttpClient,
    private globalSettingsService: GlobalSettingsService,
    private h: HelperFunctionsService
  ) {}

  httpURL =
    'http://belinda.cgv.tugraz.at:9090/api/v1/query?query=co2{location="FuzzyLab",sensor="scd30"}';
  Config = {};

  queryDefaultStep = 1000; // ms

  getHTTPData(
    url: string,
    user = this.globalSettingsService.server.influxuser,
    pass = this.globalSettingsService.server.influxpass
  ) {
    const thisurl = url ? url : this.httpURL;
    if (thisurl.startsWith('https') && thisurl.search(/\/influxdb\//)) {
      const httpOptions = {
        headers: new HttpHeaders({
          Authorization: 'Basic ' + btoa(user + ':' + pass)
        })
      };
      console.log('HEADERS', httpOptions);

      return this.http.get(thisurl, httpOptions);
    }
    console.log('ordinary HTTP');

    return this.http.get(thisurl);
  }

  public constructPrometheusEndPoint(
    server?: string,
    port?: string,
    path?: string
  ) {
    if (!server && !port && !path) {
      return this.globalSettingsService.getPrometheusEndpoint();
    }

    if (!port) {
      port = this.globalSettingsService.defaultPrometheusPort;
    }
    if (Number(port) > 0) {
      port = ':' + port;
    }
    if (!port) {
      port = '';
    }
    if (!path) {
      path = this.globalSettingsService.defaultPrometheusPath;
    }
    const protocol = port === ':443' ? 'https://' : 'http://';
    const protAndHost = server.startsWith('http') ? server : protocol + server;
    return protAndHost + port + (path.startsWith('/') ? '' : '/') + path;
  }

  private buildRangeQuery(
    queryEndPoint: string,
    queryString: string,
    start: Date,
    end: Date,
    step
  ) {
    const url =
      queryEndPoint +
      'query_range?query=' +
      queryString +
      '&start=' +
      start.toISOString() +
      '&end=' +
      end.toISOString() +
      '&step=' +
      step +
      'ms';
    // console.log(url);
    return url;
  }

  getRange(
    queryString: string,
    start: Date,
    end: Date,
    step = this.queryDefaultStep,
    queryEndPoint = this.globalSettingsService.server.prometheus
  ) {
    // console.log(start);
    // console.log(end);
    return this.http.get(
      this.buildRangeQuery(queryEndPoint, queryString, start, end, step)
    );
  }
  postData(url: string, data: any) {
    this.http.post(url, data).subscribe(
      (res: any) => {
        console.log(res);
      },
      (error: any) => {
        console.log(error);
      }
    );

    console.log(['postData', url, data]);
  }

  checkPrometheusDataValidity(data) {
    const result = this.h.getDeep(data, ['data', 'result']);
    if (!result || !Array.isArray(result)) {
      console.log('checkPrometheusDataValidity: no Array:', data);
      return false;
    }
    if (result.length === 0) {
      console.log('checkPrometheusDataValidity: datasets returned 0');
      return null;
    }
    const metric0 = this.h.getDeep(result, [0, 'metric']);
    const values0 = this.h.getDeep(result, [0, 'values']);
    if (!values0 || !metric0) {
      console.error('updateDataSet: no valid data received.');
      return false;
    }
    // check if any data there
    for (let i = 0; i < result.length; i++) {
      const dataset = result[i].values;
      if (dataset.length) {
        return true;
      }
    }
    return false;
  }

  parseInfluxData(data: Object, labelBlackList: string[] = []) {
    const tagBlackList = cloneDeep(labelBlackList);
    let retval = { labels: [], data: [] };

    const dataarray = this.h.getDeep(data, ['results', 0, 'series']);

    const labels = ['Date'];
    if (!dataarray) {
      console.log('no data');
      return retval;
    }
    let validColCount = 0;
    const seriesValidColumns = [];
    let newData = [];
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
      let serieslabel =
        tagBlackList.indexOf(series['name']) === -1 ? series['name'] : '';
      for (const tkey in tags) {
        if (tags.hasOwnProperty(tkey) && tagBlackList.indexOf(tkey) === -1) {
          const tval = tags[tkey];
          serieslabel += ' ' + tkey + ': ' + tval + ',';
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
          let colname = series['columns'][colindex];
          if (tagBlackList.indexOf(colname) > -1) {
            colname = '';
          }
          if (tagBlackList.indexOf('mean_*') > -1) {
            colname = colname.replace(/^mean_/, '');
          }

          colname = colname.replace(/percent$/, '%');
          colname = colname.replace(/_%/, '-%');
          colname = colname.replace(/degC$/, '°C');
          colname = colname.replace(/ugpm3$/, 'µg/m³');
          colname = colname.replace(/gpm3$/, 'g/m³');
          colname = colname.replace(/_(\S+)$/, ' ($1)');
          const collabel = colname ? serieslabel + ' ' + colname : serieslabel.replace(/,$/,"");
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
        let v = NaN;
        let isValid = false;
        for (let c = 0; c < validColIndices.length; c++) {
          const colInfo = validColIndices[c];
          v = row[colInfo.from];
          newRow[colInfo.to] = v;
          if (v !== null) {
            isValid = true;
          }
        }
        if (isValid) {
          newData.push(newRow);
        }
      }
    }

    // console.log('before sort', cloneDeep(newData));

    newData.sort((rowa, rowb) => rowa[0] - rowb[0]);

    for (let i = 1; i < newData.length; i++) {
      const current = newData[i];
      const previous = newData[i - 1];
      if (current[0].valueOf() == previous[0].valueOf()) {
        // timestamp the same
        let prevRowEmpty = true;
        for (let column = 1; column < current.length; column++) {
          if (current[column] === null && previous[column] !== null) {
            current[column] = previous[column];
            previous[column] = null;
          }
          if (previous[column] != null) {
            prevRowEmpty = false;
          }
        }
        if (prevRowEmpty) {
          delete newData[i - 1];
        }
      }
    }

    let newArray = []; // non-sparse Array
    newData.forEach(row => {
      if (row !== undefined) {
        newArray.push(row);
      }
    });

    // console.log('after sort', cloneDeep(newArray));

    retval['labels'] = labels;
    retval['data'] = newArray;

    return retval;
  }
}
