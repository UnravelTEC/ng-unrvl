import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { GlobalSettingsService } from '../core/global-settings.service';
import { HelperFunctionsService } from '../core/helper-functions.service';

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

  getHTTPData(url: string) {
    const thisurl = url ? url : this.httpURL;
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

  parseInfluxData(data: Object) {
    let retval = { labels: [], data: [] };

    const dataarray = this.h.getDeep(data, ['results', 0, 'series']);

    const labels = ['Date'];
    if (!dataarray) {
      console.log('no data');
      return retval;
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
    retval['labels'] = labels;
    retval['data'] = newData;

    return retval;
  }
}
