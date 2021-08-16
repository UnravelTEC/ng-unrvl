import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { GlobalSettingsService } from '../core/global-settings.service';
import { HelperFunctionsService } from '../core/helper-functions.service';

import { HttpHeaders } from '@angular/common/http';
import { cloneDeep } from 'lodash-es';

@Injectable({
  providedIn: 'root',
})
export class UtFetchdataService {
  constructor(
    private http: HttpClient,
    private globalSettingsService: GlobalSettingsService,
    private h: HelperFunctionsService
  ) {}

  getHTTPData(
    thisurl: string,
    user = this.globalSettingsService.server.influxuser,
    pass = this.globalSettingsService.server.influxpass,
    forceauth = false
  ) {
    console.log('getHTTPData:', thisurl, user, pass);

    if (
      forceauth ||
      (thisurl.startsWith('https') && thisurl.search(/\/influxdb\//))
    ) {
      const httpOptions = {
        headers: new HttpHeaders({
          Authorization: 'Basic ' + btoa(user + ':' + pass),
        }),
      };
      console.log('HEADERS', httpOptions);

      return this.http.get(thisurl, httpOptions);
    }
    console.log('ordinary HTTP');

    return this.http.get(thisurl);
  }

  postData(
    url: string,
    data: any,
    user = this.globalSettingsService.server.influxuser,
    pass = this.globalSettingsService.server.influxpass,
    forceauth = false
  ) {
    console.log('postData:', url, data, user, pass);

    if (forceauth || (url.startsWith('https') && url.search(/\/influxdb\//))) {
      const httpOptions = {
        headers: new HttpHeaders({
          Authorization: 'Basic ' + btoa(user + ':' + pass),
        }),
      };
      console.log('HEADERS', httpOptions);
      return this.http.post(url, data, httpOptions);
    }

    return this.http.post(url, data);
  }

  influxTimeString(param1: any, param2: Date = undefined) {
    if (param2) {
      return (
        ' time > ' +
        param1.valueOf() +
        'ms AND time < ' +
        param2.valueOf() +
        'ms '
      );
    }
    return ' time > now() - ' + param1 + ' ';
  }

  /*
  @ param tagfilter = { 'sensor': ['SDS011', 'SPS30'] } // OR
  tagfilter = { 'sensor': 'BME280', // AND
                'id': '0x77'] }
  */

  influxMeanQuery(
    from: string,
    timeQuery: string,
    tagfilter: Object = {},
    mean_s = 30,
    select = '*'
  ) {
    let q = 'SELECT mean(' + select + ') FROM ' + from;

    let whereClause = '';

    for (const key in tagfilter) {
      if (tagfilter.hasOwnProperty(key)) {
        const andobj = tagfilter[key];
        if (Array.isArray(andobj) && andobj.length) {
          whereClause += '(';
          for (let i = 0; i < andobj.length; i++) {
            const value = andobj[i];
            whereClause += key + " = '" + value + "'";
            if (i + 1 != andobj.length) {
              whereClause += ' OR ';
            }
          }
          whereClause += ') AND ';
        } else if (andobj && andobj.length) {
          whereClause += key + " = '" + andobj + "' AND ";
        }
      }
    }
    whereClause += timeQuery;

    let groupBy = ' GROUP BY ';
    if (tagfilter && Object.keys(tagfilter).length > 1) {
      // FIXME don't know if "if" works
      for (const key in tagfilter) {
        if (tagfilter.hasOwnProperty(key)) {
          groupBy += key + ',';
        }
      }
      groupBy += 'host,id,time(' + String(mean_s) + 's)';
    } else {
      groupBy += '*,time(' + String(mean_s) + 's)';
    }

    q += ' WHERE ' + whereClause + groupBy + ';';
    return q;
  }
  buildInfluxQuery(
    clause: string,
    database?: string,
    serverstring?: string,
    epoch = 'ms'
  ) {
    const cleanClause = clause.replace(/;/g, '%3B');
    if (database === undefined) {
      database = this.globalSettingsService.server.influxdb;
    }
    if (serverstring === undefined) {
      serverstring = this.globalSettingsService.server.baseurl;
    }
    return (
      serverstring +
      '/influxdb/query?db=' +
      database +
      '&epoch=' +
      epoch +
      '&q=' +
      cleanClause
    );
  }
  buildInfluxWriteUrl(database?: string, serverstring?: string) {
    if (database === undefined) {
      database = this.globalSettingsService.server.influxdb;
    }
    if (serverstring === undefined) {
      serverstring = this.globalSettingsService.server.baseurl;
    }
    return serverstring + '/influxdb/write?db=' + database;
  }
  buildInfluxDelQuery(
    clause: string,
    database?: string,
    serverstring?: string
  ) {
    const cleanClause = clause.replace(/;/g, '%3B');
    if (database === undefined) {
      database = this.globalSettingsService.server.influxdb;
    }
    if (serverstring === undefined) {
      serverstring = this.globalSettingsService.server.baseurl;
    }
    return (
      serverstring + '/influxdb/query?db=' + database + '&q=' + cleanClause // &epoch=s
    );
  }

  parseInfluxData(
    data: Object,
    labelBlackList: string[] = [],
    epoch: string = 'ms'
  ) {
    const tagBlackList = cloneDeep(labelBlackList);
    let retval = { labels: [], data: [] };

    const results = this.h.getDeep(data, ['results']);
    if (!results) {
      console.log('no results');
      return retval;
    }
    if (results[0] && results[0]['error']) {
      retval['error'] = results[0]['error'];
      console.log(
        'parseInfluxData encountered influx error statement',
        retval['error']
      );
      return retval;
    }
    let dataarray = [];
    for (let statementId = 0; statementId < results.length; statementId++) {
      const statement = results[statementId];
      if (statement['series']) {
        const seriesArray = statement['series'];
        console.log('statement', statementId, 'with len', seriesArray.length);

        for (let seriesI = 0; seriesI < seriesArray.length; seriesI++) {
          const series = seriesArray[seriesI];
          dataarray.push(series);
          console.log(
            'from',
            new Date(series.values[0][0]),
            'to',
            new Date(series.values[series.values.length - 1][0])
          );
        }
      }
    }
    if (!dataarray) {
      console.log('no data');
      return retval;
    }

    let factor = 1;
    if (epoch == 's') {
      factor = 1000;
    }

    const labels = ['Date'];
    const orig_labels = [];
    let raw_labels = [{ metric: 'Date', tags: {}, field: '' }];

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
          orig_labels.push(serieslabel + ' ' + colname);
          raw_labels.push({
            metric: series['name'],
            tags: tags,
            field: colname,
          });
          if (tagBlackList.indexOf(colname) > -1) {
            colname = '';
          }
          if (tagBlackList.indexOf('mean_*') > -1) {
            colname = colname.replace(/^mean_/, '');
          }

          colname = this.h.formatFieldName(colname);

          const collabel = colname
            ? serieslabel + ' ' + colname
            : serieslabel.replace(/,$/, '');
          labels.push(collabel.trim());
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
        newRow[0] = new Date(row[0] * factor); // Date
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
    newData.forEach((row) => {
      if (row !== undefined) {
        newArray.push(row);
      }
    });

    // console.log('after sort', cloneDeep(newArray));

    retval['labels'] = labels;
    retval['data'] = newArray;
    retval['orig_labels'] = orig_labels;
    retval['raw_labels'] = raw_labels;

    retval['short_labels'] = [];
    retval['common_label'] = '';

    let common_metric = true;
    let common_tags = {};
    if (retval['raw_labels'].length > 2) {
      const first_metric = retval['raw_labels'][1].metric;
      for (let i = 2; i < retval['raw_labels'].length; i++) {
        if (first_metric != retval['raw_labels'][i].metric) {
          common_metric = false;
          break;
        }
      }
      const first_tagset = retval['raw_labels'][1].tags;
      for (const tkey in first_tagset) {
        if (Object.prototype.hasOwnProperty.call(first_tagset, tkey)) {
          const tvalue = first_tagset[tkey];
          common_tags[tkey] = tvalue;
          for (let i = 2; i < retval['raw_labels'].length; i++) {
            const elementtags = retval['raw_labels'][i].tags;
            if (
              !Object.prototype.hasOwnProperty.call(elementtags, tkey) ||
              common_tags[tkey] != elementtags[tkey]
            ) {
              delete common_tags[tkey];
              break;
            }
          }
        }
      }
    }
    if (common_metric && retval['raw_labels'].length > 1) {
      retval['common_label'] = retval['raw_labels'][1].metric;
    }
    for (const tkey in common_tags) {
      if (Object.prototype.hasOwnProperty.call(common_tags, tkey)) {
        retval['common_label'] += ', ' + tkey + ': ' + common_tags[tkey];
      }
    }
    for (let i = 1; i < retval['labels'].length; i++) {
      const label = retval['labels'][i];
      retval['short_labels'][i - 1] = label;
      if (common_metric) {
        retval['short_labels'][i - 1] = label.replace(
          retval['raw_labels'][1].metric + ' ',
          ''
        );
      }
      for (const tkey in common_tags) {
        if (Object.prototype.hasOwnProperty.call(common_tags, tkey)) {
          const tval = common_tags[tkey];
          retval['short_labels'][i - 1] = retval['short_labels'][i - 1].replace(
            tkey + ': ' + tval + ', ',
            ''
          );
        }
      }
    }

    return retval;
  }
}
