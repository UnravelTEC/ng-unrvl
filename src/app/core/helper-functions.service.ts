import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { formatDate } from '@angular/common';
import * as FileSaver from 'file-saver';
import { cloneDeep } from 'lodash-es';

@Injectable({
  providedIn: 'root',
})
export class HelperFunctionsService {
  domainAndApp = '';
  domain = '';

  // sorted in order of usage
  colors = {
    blue: ['#0000FF', '#6883FF', '#000055', '#394CFF', '#000094'],
    green: ['#008D0A', '#69F97B', '#002402', '#1EF93A', '#023C0A'],
    brown: ['#FF5B00', '#FFDD73', '#561D0B', '#FF9C06', '#883A06'],
    red: ['#E10000', '#FF7F88', '#520000', '#F81E25', '#990000'],
    navy: ['#0061A6', '#00D9FF', '#001341', '#007CC2', '#002C54'],
    violet: ['#842BFF', '#FFEBFF', '#2B0069', '#C78DFF', '#470994'],
    olive: ['#00805C', '#8CE2CD', '#002913', '#37A389', '#003C24'],
  };
  colorOrder = ['green', 'blue', 'red', 'brown', 'olive', 'navy', 'violet'];
  colorArray = [];

  defaultColorMappings = {};

  avgPresets = [
    { '1m': 60 },
    { '5m': 300 },
    { '15m': 900 },
    { '30m': 1800 },
    { '1h': 3600 },
    { '1d': 86400 },
    { '7d': 604800 },
    { '30d': 2592000 },
  ];
  keys(o) {
    // for use in htmls
    return Object.keys(o);
  }
  vals(o) {
    return Object.values(o);
  }

  /*
   * 1-deep obj comparison, no nested objects!
   * If Objects are sorted differently, returns false!
  */
  objectsEqual(o1, o2): boolean {
    const entries1 = Object.entries(o1);
    const entries2 = Object.entries(o2);
    if (entries1.length !== entries2.length) {
      return false;
    }
    for (let i = 0; i < entries1.length; ++i) {
      // Keys
      if (entries1[i][0] !== entries2[i][0]) {
        return false;
      }
      // Values
      if (entries1[i][1] !== entries2[i][1]) {
        return false;
      }
    }
    return true;
  }
  rawLabelsEqual(l1: Object, l2: Object): boolean {
    if (l1['metric'] !== l2['metric'] || l1['field'] !== l2['field']) {
      return false
    }
    const l1tags = l1['tags']
    const l2tags = l2['tags']
    const l1tagkeys = Object.keys(l1tags)
    const l2tagkeys = Object.keys(l2tags)
    if (l1tagkeys.length != l2tagkeys.length) {
      return false
    }
    l1tagkeys.forEach(l1tagk => {
      if (l1tags[l1tagk] != l2tags[l1tagk]) {
        return false
      }
    });
    return true
  }

  constructor(private loc: Location) {
    const url = window.location.href;
    const angularRoute = this.loc.path();
    this.domainAndApp = url.replace(angularRoute, '');
    this.domain = this.domainAndApp.replace(/:[0-9]*$/, '').replace(/[?]/, '');
    console.log('window.location.href:', url);
    console.log('domainAndApp', this.domainAndApp);
    console.log('domain', this.domain);

    for (let cWeightI = 0; cWeightI < this.colors.blue.length; cWeightI++) {
      for (let cOrderI = 0; cOrderI < this.colorOrder.length; cOrderI++) {
        const colorstr = this.colorOrder[cOrderI];
        this.colorArray.push(this.colors[colorstr][cWeightI]);
      }
    }
    this.defaultColorMappings = {
      // define here to calm down TS
      'dew point': 'blue',
      '°C': 'red',
      temperature: 'red',
      humidity: 'blue',
      pressure: 'green',
      particulate_matter: 'brown',
      gas: 'violet',
    };
    // console.log('new Colors:', this.colorArray);
  }
  /**
   * @param labels Array of labels
   * @param searchToColor Object { 'searchstring' : '$color' } - color from h.colors
   */

  getColorsforLabels(
    labels: Array<string>,
    searchToColor = this.defaultColorMappings
  ): Array<string> {
    const newColors = [];
    const colorCounters = {};
    for (let c = 1; c < labels.length; c++) {
      const currentLabel = labels[c];
      for (const searchstring in searchToColor) {
        if (searchToColor.hasOwnProperty(searchstring)) {
          if (currentLabel.match(searchstring)) {
            // console.log(
            //   'getColorsforLabels:',
            //   currentLabel,
            //   'matched',
            //   searchstring
            // );
            const colorset = searchToColor[searchstring];
            const rightColorArray = this.colors[colorset];
            if (!colorCounters.hasOwnProperty(colorset)) {
              colorCounters[colorset] = 0;
              newColors.push(rightColorArray[0]);
            } else {
              const i = (colorCounters[colorset] += 1);
              newColors.push(rightColorArray[i % rightColorArray.length]);
            }
            break;
          }
        }
      }
    }
    // console.log('getColorsforLabels:', newColors);

    return newColors;
  }

  // 'green:#00FF00',
  //   'yellow:#FFFF00',
  //   'orange:#FFA600',
  //   'red:#FF0000',
  //   '(dark)violet:#800080',
  returnColorForPercent(percent, colorRamp?: Array<string>, debug = false) {
    if (!colorRamp || colorRamp.length == 0) {
      colorRamp = ['#00FF00', '#FFFF00', '#FFA600', '#FF0000', '#800080'];
    }
    function colorFromPercent(
      percent: number,
      cfrom: string,
      cto: string,
      cdebug = debug
    ): string {
      if (cfrom == cto) {
        return cto;
      }
      const from_int = parseInt(cfrom, 16);
      const to_int = parseInt(cto, 16);
      const range = to_int - from_int;
      const hexstr = Math.floor(from_int + (percent / 100) * range).toString(
        16
      );
      if (cdebug)
        console.log(
          'colorFromPercent:',
          percent,
          from_int,
          to_int,
          parseInt(hexstr, 16)
        );

      return hexstr.length < 2 ? '0' + hexstr : hexstr;
    }
    if (debug) console.log(percent, colorRamp);

    const nr_sections = colorRamp.length - 1;
    const section_len_percent = 100 / nr_sections;
    const needed_section =
      percent < 100
        ? Math.floor(percent / section_len_percent)
        : nr_sections - 1;

    if (!colorRamp[needed_section]) {
      console.error(
        'percent',
        percent,
        'nr_sections',
        nr_sections,
        'needed_section',
        needed_section
      );
      return '#FFFFFF';
    }
    const lower_bound = colorRamp[needed_section];
    const upper_bound = colorRamp[needed_section + 1];
    const r_lower = lower_bound.substring(1, 3);
    const g_lower = lower_bound.substring(3, 5);
    const b_lower = lower_bound.substring(5, 7);
    const r_upper = upper_bound.substring(1, 3);
    const g_upper = upper_bound.substring(3, 5);
    const b_upper = upper_bound.substring(5, 7);
    if (debug)
      console.log(
        r_lower + g_lower + b_lower,
        'to',
        r_upper + g_upper + b_upper
      );

    const bucked_size = 100 / nr_sections;
    const sec_percent =
      percent != 100 ? (percent % bucked_size) * nr_sections : 100;
    const new_r = colorFromPercent(sec_percent, r_lower, r_upper);
    const new_g = colorFromPercent(sec_percent, g_lower, g_upper);
    const new_b = colorFromPercent(sec_percent, b_lower, b_upper);
    // console.log('percent', percent, 'nr_sections', nr_sections, 'needed_section', needed_section, new_r, new_g, new_b );
    if (debug) console.log(percent, 'rgb #' + new_r + new_g + new_b);

    return '#' + new_r + new_g + new_b;
  }

  getBaseURL() {
    return this.domain;
  }

  getDeep(obj: Object, argumentsArray: Array<any>): any {
    if (!obj) {
      console.error('getDeep: !obj');
      return undefined;
    }
    while (argumentsArray.length) {
      const currentIndex = argumentsArray.shift();
      if (obj.hasOwnProperty(currentIndex)) {
        obj = obj[currentIndex];
      } else {
        return undefined;
      }
    }
    return obj;
  }
  calcMedianGap(dygData) {
    if (dygData.length < 2) {
      return NaN
    }
    if (dygData.length == 2) {
      return dygData[1][0].valueOf() - dygData[0][0].valueOf()
    }
    const dtArr = [];
    const analyze_length = Math.min(15, dygData.length);
    for (let i = 1; i < analyze_length; i++) {
      dtArr.push(dygData[i][0].valueOf() - dygData[i - 1][0].valueOf());
    }
    const sorteddts = dtArr.sort();
    const center_i = Math.round(sorteddts.length / 2);
    return sorteddts[center_i];
  }
  influx2geojsonPoints(data, labels = []): GeoJSON.FeatureCollection<any> {
    let points: GeoJSON.FeatureCollection<any> = {
      type: 'FeatureCollection',
      features: [],
    };
    let latlabelpos: number, lonlabelpos: number;
    if (labels.length > 2) {
      for (let i = 1; i < labels.length; i++) {
        // first: Date
        const element = labels[i];
        if (element.indexOf('location') > -1) {
          if (element.indexOf('lat') > -1) {
            latlabelpos = i;
          } else if (element.indexOf('lon') > -1) {
            lonlabelpos = i;
          }
        }
      }
    }
    if (!latlabelpos || !lonlabelpos) {
      console.error(
        'error in influx2geojsonPoints, lat or lon not found in',
        labels
      );
      return undefined;
    }
    if (!data.length) {
      console.log('influx2geojsonPoints: no data');
      return undefined;
    }

    for (let i = 0; i < data.length; i++) {
      const element = data[i];
      let coords = [];
      if (labels.length == 0) {
        coords = [element[2], element[1]];
      } else {
        coords = [element[lonlabelpos], element[latlabelpos]];
      }
      if (!coords[0] || !coords[1]) {
        continue;
      }
      const point: GeoJSON.Feature<any> = {
        type: 'Feature' as const,
        properties: { Date: element[0] },
        geometry: {
          type: 'Point',
          coordinates: coords,
        },
      };
      if (labels.length > 3) {
        for (let i = 1; i < labels.length; i++) {
          const label = labels[i];
          // if (i != latlabelpos && i != lonlabelpos) {
          point.properties[label] = element[i];
          // }
        }
      }
      points.features.push(point);
    }
    // console.log('geojson:', points);

    return points;
  }

  parseToSeconds(inputString: string): number {
    if (typeof inputString !== 'string') {
      console.log('parseToSeconds:', inputString, "not a string, but", typeof inputString);
      return inputString;
    }
    if (
      inputString.endsWith('s') &&
      parseInt(inputString.slice(0, -1), 10) > 0
    ) {
      return parseInt(inputString.slice(0, -1), 10);
    }
    if (
      inputString.endsWith('m') &&
      parseInt(inputString.slice(0, -1), 10) > 0
    ) {
      return parseInt(inputString.slice(0, -1), 10) * 60;
    }
    if (
      inputString.endsWith('h') &&
      parseInt(inputString.slice(0, -1), 10) > 0
    ) {
      return parseInt(inputString.slice(0, -1), 10) * 60 * 60;
    }
    if (
      inputString.endsWith('d') &&
      parseInt(inputString.slice(0, -1), 10) > 0
    ) {
      return parseInt(inputString.slice(0, -1), 10) * 60 * 60 * 24;
    }
    if (
      inputString.endsWith('y') &&
      parseInt(inputString.slice(0, -1), 10) > 0
    ) {
      return parseInt(inputString.slice(0, -1), 10) * 60 * 60 * 24 * 365;
    }
    return undefined;
  }

  // array must be consecutive!
  // returns the two indizes in which between the searched Date is
  binarySearchNearDate(
    inputArray: Array<[Date, any]>,
    target: Date,
    ObjectPath?: String
  ) {
    let lowerIndex = 0,
      upperIndex = inputArray.length - 1;

    function compareDate(date1: Date, date2: Date) {
      if (!date1 || !date2) {
        return undefined;
      }
      if (date1.valueOf() === date2.valueOf()) {
        return 0;
      }
      return date1.valueOf() > date2.valueOf() ? 1 : -1;
    }

    while (lowerIndex + 1 < upperIndex) {
      const halfIndex = (lowerIndex + upperIndex) >> 1; // tslint:disable-line
      const halfElem = inputArray[halfIndex][0];

      const comparisonResult = compareDate(target, halfElem);
      if (comparisonResult === undefined) {
        return [undefined, undefined];
      }
      if (comparisonResult === 0) {
        lowerIndex = halfIndex;
        upperIndex = halfIndex;
        break;
      }
      if (comparisonResult > 0) {
        lowerIndex = halfIndex;
      } else {
        upperIndex = halfIndex;
      }
    }

    return [lowerIndex, upperIndex];
  }

  returnDataRange(indata, from: Date, to: Date) {
    if (!indata.length || !from || !to) {
      console.error('returnDataRange: empty input', indata, from, to);
      return [];
    }

    function isbetweenDate(target: Date, lower: Date, upper: Date) {
      return (
        (lower.valueOf() <= target.valueOf() &&
          upper.valueOf() > target.valueOf()) ||
        upper.valueOf() === target.valueOf()
      );
    }

    console.log('slicing from', from, 'to', to, 'in', indata);
    let startindex;
    if (from.valueOf() <= indata[0][0].valueOf()) {
      startindex = 0;
    }
    let endindex;
    if (to.valueOf() >= indata[indata.length - 1][0].valueOf()) {
      endindex = indata.length - 1;
    }

    for (let i = 0; i < indata.length - 1; i++) {
      const elementDate = indata[i][0];
      const nextElement = indata[i + 1][0];
      if (startindex === undefined) {
        // if(i === 0) {
        //   console.log(elementDate.valueOf(), from.valueOf())
        // }
        if (isbetweenDate(from, elementDate, nextElement)) {
          startindex = i;
          continue;
        }
      }
      if (endindex === undefined) {
        if (isbetweenDate(to, elementDate, nextElement)) {
          endindex = i;
          break;
        }
      }
    }
    if (startindex === undefined) {
      console.error('startindex not found');
      return [];
    }
    if (!endindex) {
      endindex = indata.length;
    }
    const outdata = indata.slice(startindex, endindex + 1);

    console.log('dataslice from', startindex, 'to', endindex);

    return outdata;
  }

  createLabelString(lObj: Object, blackListLabels: string[] = []): string {
    const labelBlackList = cloneDeep(blackListLabels);
    //$sensor@host
    let labelString = '';
    if (lObj['sensor'] && labelBlackList.indexOf('sensor') === -1) {
      labelString = lObj['sensor'];
      labelBlackList.push('sensor');
    }
    if (lObj['model'] && labelBlackList.indexOf('model') === -1) {
      labelString = lObj['model'];
      labelBlackList.push('model');
    }
    if (lObj['node'] && labelBlackList.indexOf('node') === -1) {
      labelString += '@' + lObj['node'];
      labelBlackList.push('node');
    }

    let firstDone = false;
    for (let key in lObj) {
      let value = lObj[key];

      let isInBlackList = false;
      if (labelBlackList) {
        labelBlackList.forEach((item) => {
          if (key == item) {
            isInBlackList = true;
          }
        });
      }
      if (isInBlackList) {
        continue;
      }

      if (key === 'model' && value === 'adc') {
        continue;
      }
      if (key === 'job') {
        continue;
      }
      if (key === 'channel') {
        key = 'ch';
      }
      if (key === 'interval') {
        key = 'i';
      }
      if (value === 'temperature_degC') {
        value = 'T';
      }
      if (value === 'humidity_rel_percent') {
        value = 'rH';
      }

      if (firstDone) {
        labelString += ', ';
      } else {
        if (labelString) {
          labelString += ': ';
        }
        firstDone = true;
      }
      if (key === '__name__') {
        labelString += value;
        continue;
      }
      labelString += key + ': ' + value;
    }
    if (!labelString) {
      labelString = 'average'; // FIXME maybe something else...
    }
    return labelString;
  }

  exportCSV(data, labels, utc = true, missing = true) {
    // header
    const separator = '\t';
    const linebreak = '\n';
    console.log('utc:', utc);

    let header = '';
    if (labels.length === 0 || data.length === 0) {
      alert('no data to export');
      return;
    }
    let step = 1000;
    if (data.length > 1) {
      step = data[1][0].valueOf() - data[0][0].valueOf();
    }
    // detect if data is with bounds
    let isWithBounds = undefined;
    for (let row = 0; row < data.length; row++) {
      for (let column = 1; column < data[row].length; column++) {
        let element = data[row][column];
        if (Array.isArray(element)) {
          isWithBounds = element.length;
          break;
        }
        if (element != null && !isNaN(element)) {
          isWithBounds = false;
          break;
        }
      }
      if (isWithBounds !== undefined) {
        break;
      }
    }
    console.log('isWithBounds:' + isWithBounds);

    for (let i = 0; i < labels.length; i++) {
      const element = labels[i];
      if (i > 0) {
        header += separator;
      }
      if (i > 0 && isWithBounds == 3) {
        header +=
          element.replace(/,/g, ';') + ' (lower error range)' + separator;
      }
      header += element.replace(/,/g, ';'); // data label
      if (i > 0 && isWithBounds == 3) {
        header +=
          separator + element.replace(/,/g, ';') + ' (upper error range)';
      }
      if (i > 0 && isWithBounds == 2) {
        header += separator + element.replace(/,/g, ';') + ' (std deviation)';
      }
      if (i === 0) {
        header +=
          separator +
          'Date (' +
          (utc
            ? 'UTC'
            : new Date()
              .toLocaleTimeString('en-us', { timeZoneName: 'short' })
              .split(' ')[2]) +
          ')';
      }
    }
    header += linebreak;

    let csvbody = '';
    function parseRow(row) {
      let line = '';
      for (let column = 0; column < row.length; column++) {
        const element = row[column];
        if (column === 0) {
          line += String(element.valueOf() / 1000) + separator;
          line += utc ? element.toUTCString() : element.toString();
        } else {
          line += separator;

          if (isWithBounds) {
            if (Array.isArray(element)) {
              for (let i = 0; i < element.length; i++) {
                const bound = element[i];
                if (i > 0) {
                  line += separator;
                }
                line += String(bound);
              }
            } else {
              // null or NaN
              for (let i = 0; i < isWithBounds; i++) {
                if (i > 0) {
                  line += separator;
                }
                line += String(element);
              }
            }
          } else {
            line += String(element);
          }
        }
      }
      return line + linebreak;
    }
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      csvbody += parseRow(row);

      // gap detection
      if (i > 2 && i < data.length - 1) {
        let currentTS = row[0].valueOf();
        let nextTS = data[i + 1][0].valueOf();
        while (currentTS + step < nextTS) {
          currentTS += step;
          const row = [new Date(currentTS)];
          for (let c = 1; c < labels.length; c++) {
            row.push(null);
          }
          csvbody += parseRow(row);
        }
      }
    }

    const csv = header + csvbody;
    // console.log(csv);

    const blob = new Blob([csv], { type: 'text/csv' });

    const startDate = data[0][0];
    const endDate = data[data.length - 1][0];

    const name =
      formatDate(startDate, 'yyyy-MM-dd_HH.mm.ss', 'en-uk') +
      '-' +
      formatDate(endDate, 'HH.mm.ss', 'en-uk') +
      '.csv';
    FileSaver.saveAs(blob, name);
  }
  exportGeojson(geojsondata) {
    console.log('exporting', geojsondata);

    if (!geojsondata['type']) {
      alert('geojson data not valid');
      return;
    }
    let name = 'date_unknown.geojson';
    if (geojsondata.features && geojsondata.features.length) {
      const datefield = geojsondata.features[0].properties.hasOwnProperty(
        'Date'
      )
        ? 'Date'
        : 'date';
      name =
        formatDate(
          geojsondata.features[0].properties[datefield],
          'yyyy-MM-dd_HH.mm.ss',
          'en-uk'
        ) +
        '-' +
        formatDate(
          geojsondata.features[geojsondata.features.length - 1].properties[
          datefield
          ],
          'yyyy-MM-dd_HH.mm.ss',
          'en-uk'
        ) +
        '.geojson';
    }

    const blob = new Blob([JSON.stringify(geojsondata)], {
      type: 'text/geojson',
    });
    FileSaver.saveAs(blob, name);
  }

  isString(x) {
    return Object.prototype.toString.call(x) === '[object String]';
  }

  relHumidity(argT, argDP) {
    if (argT === null || argDP === null) return null;
    if (isNaN(argT) || isNaN(argDP)) return NaN;
    const T = this.isString(argT) ? Number(argT) : argT;

    let a: number, b: number;
    if (T >= 0) {
      a = 7.5;
      b = 237.3;
    } else {
      a = 7.6;
      b = 240.7;
    }

    const SDD = 6.1078 * Math.pow(10, (a * T) / (b + T)); // Sättigungsdampfdruck in hPa
    const SDDDP = 6.1078 * Math.pow(10, (a * argDP) / (b + argDP));
    const rH = (100 * SDDDP) / SDD;
    return rH;
  }
  absHumidity(argT, argRH) {
    if (argT === null || argRH === null) return null;
    if (isNaN(argT) || isNaN(argRH)) return NaN;

    const T = this.isString(argT) ? Number(argT) : argT;
    const rH = this.isString(argRH) ? Number(argRH) : argRH;
    // console.log('aH(', T, rH, ')');
    // from https://www.wetterochs.de/wetter/feuchte.html
    const T_K = T + 273.15;
    let a: number, b: number;
    if (T >= 0) {
      a = 7.5;
      b = 237.3;
    } else {
      a = 7.6;
      b = 240.7;
    }
    const m_w = 18.016; // kg/kmol Molekulargewicht des Wasserdampfes
    const R = 8314.3; // J/(kmol*K) (universelle Gaskonstante)

    const SDD = 6.1078 * Math.pow(10, (a * T) / (b + T)); // Sättigungsdampfdruck in hPa
    const DD = (rH / 100) * SDD; // Dampfdruck in hPa
    return 100000 * (m_w / R) * (DD / T_K);

    //=  10^5 * mw/R* * DD(r,T)/TK; AF(TD,TK) = 10^5 * mw/R* * SDD(TD)/TK
    // console.log('result:', aH);
  }
  heatIndex(T, rH) {
    if (rH < 40) {
      return T
    }
    //source: https://de.wikipedia.org/wiki/Hitzeindex
    const c1 = -8.784695, c2 = 1.61139411, c3 = 2.338549, c4 = -0.14611605, c5 = -1.2308094e-2,
      c6 = -1.6424828e-2, c7 = 2.211732e-3, c8 = 7.2546e-4, c9 = -3.582e-6
    const T2 = T * T
    const H2 = rH * rH
    const hi = c1 + c2 * T + c3 * rH + c4 * T * rH + c5 * T2 + c6 * H2 + c7 * T2 * rH + c8 * T * H2 + c9 * T2 * H2
    if (hi < T) {
      return T
    }
    return hi
    //Grafana:  -8.784695 + 1.61139411 * $T + 2.338549 * $H -0.14611605 * $T * $H -1.2308094e-2 * $T2 -1.6424828e-2 * $H2 + 2.211732e-3 * $T2 * $H + 7.2546e-4 * $T * $H2 -3.582e-6 * $T2 * $H2
  }


  dewPoint(argT, argRH, P = 972) {
    if (argT === null || argRH === null) return null;
    if (isNaN(argT) || isNaN(argRH)) return NaN;

    const T = this.isString(argT) ? Number(argT) : argT;
    const rH = this.isString(argRH) ? Number(argRH) : argRH;

    // source: https://en.wikipedia.org/wiki/Dew_point#Calculating_the_dew_point
    // todo enhance with constants for different temperature sets
    let a: number, b: number, c: number, d: number;
    a = 6.1121; //mbar
    b = 18.678;
    c = 257.14; // °C
    d = 234.5; // °C

    const y_m = Math.log((rH / 100) * Math.exp((b - T / d) * (T / (c + T))));
    return (c * y_m) / (b - y_m);
  }

  private e = Math.exp(1);
  // smooth sensor values at bottom of measurement range
  smoothNO2(value, threshold = 20.0) {
    if (value === null) return NaN;
    if (value > threshold) return value;
    const factor = threshold / this.e;
    return Math.exp(value / threshold) * factor;
  }

  calcHTMLColor(r_lux, g_lux, b_lux) {
    let max = Math.max(r_lux, g_lux, b_lux);
    let r = Math.round((r_lux / max) * 255);
    let g = Math.round((g_lux / max) * 255);
    let b = Math.round((b_lux / max) * 255);
    const r_hex = ('00' + r.toString(16)).substr(-2),
      g_hex = ('00' + g.toString(16)).substr(-2),
      b_hex = ('00' + b.toString(16)).substr(-2);
    const htmlColor = '#' + r_hex + g_hex + b_hex;
    return htmlColor;
  }

  /* series: array [[Date,values...][Date,values...]]
  returns object with array (the same format, len -1 of input) and the averages for each series*/
  calc1stDev(series = []) {
    // change per second
    if (!series.length || series.length < 2) {
      console.error('not enough input for calc1stDev, return');
      return { devs: [], avgs: [], error: true };
    }
    const devs = [];
    const seriesSumDevs = [];
    for (let c = 1; c < series[0].length; c++) {
      seriesSumDevs.push(0);
    }
    for (let i = 1; i < series.length; i++) {
      const thisrow = series[i];
      const lastrow = series[i - 1];
      const deltas = [];
      for (let c = 0; c < thisrow.length; c++) {
        // all time AND value deltas
        if (c === 0) {
          deltas[c] = thisrow[c].valueOf() - lastrow[c].valueOf();
        } else {
          deltas[c] = thisrow[c] - lastrow[c];
        }
      }
      const deltaPerUnit = [thisrow[0]]; // timestamp
      for (let c = 1; c < deltas.length; c++) {
        deltaPerUnit[c] = (deltas[c] / deltas[0]) * 1000; // to make it per second
        seriesSumDevs[c - 1] += deltaPerUnit[c];
      }
      devs.push(deltaPerUnit);
    }
    const avgDevs = [];
    const len = devs.length;
    for (let c = 0; c < seriesSumDevs.length; c++) {
      avgDevs[c] = seriesSumDevs[c] / len;
    }
    return { devs: devs, avgs: avgDevs };
  }

  addNewReceivedSensorToFilter(
    sensor: string,
    receivedSensors: Object,
    sensorPriority: string[]
  ) {
    if (receivedSensors.hasOwnProperty(sensor)) {
      return;
    }
    // if the new sensor is higher priority than others, true and each other false
    let currentHighest;
    for (let [key, value] of Object.entries(receivedSensors)) {
      if (value == true) {
        currentHighest = key;
        break;
      }
    }
    if (!currentHighest) {
      receivedSensors[sensor] = true;
      console.log('initial sensor:', sensor);
      return;
    }
    let currentHighestOrder = 4242;
    let newOrder = 4242;
    for (let i = 0; i < sensorPriority.length; i++) {
      const element = sensorPriority[i];
      if (element === currentHighest) {
        currentHighestOrder = i;
        continue;
      }
      if (element === sensor) {
        newOrder = i;
      }
    } // if not found, it stays the initial value
    if (newOrder < currentHighestOrder) {
      console.log('currentHighest: ', currentHighest);
      receivedSensors[currentHighest] = false;
      receivedSensors[sensor] = true;
      console.log('new better sensor found:', sensor);
    } else {
      console.log('new sensor not better', sensor);
      receivedSensors[sensor] = false;
    }
  }
  getSensorFromTopic(topic: string) {
    const parts = topic.split('/');
    if (parts.length < 2 || parts[1] !== 'sensors') {
      console.error('topic not in /sensors/ - format ');
      return undefined;
    }
    return parts[2];
  }

  createHRTimeString(seconds) {
    // human-readable
    const currentMS = Math.round((seconds % 1) * 1000);
    const textMS = currentMS ? String(currentMS) + ' ms' : '';
    const currentSeconds = Math.floor(seconds);
    const displayedSeconds = currentSeconds % 60;
    const textSeconds = displayedSeconds ? String(displayedSeconds) + '" ' : '';

    const currentMinutes = Math.floor(currentSeconds / 60);
    const displayedMinutes = currentMinutes % 60;
    const textMinutes = displayedMinutes ? String(displayedMinutes) + "' " : '';

    const currentHours = Math.floor(currentMinutes / 60);
    const displayedHours = currentHours % 24;
    const textHours = displayedHours ? String(displayedHours) + ' h ' : '';

    const currentDays = Math.floor(currentHours / 24);
    const textDays = currentDays ? String(currentDays) + ' d ' : '';

    return (textDays + textHours + textMinutes + textSeconds + textMS).trim();
  }

  deepCopyInto(firstObj, secondObj) {
    for (const key in secondObj) {
      if (secondObj.hasOwnProperty(key)) {
        const element = secondObj[key];
        if (typeof element !== 'object' || element === null) {
          firstObj[key] = element;
        } else {
          if (!firstObj.hasOwnProperty(key))
            firstObj[key] = { noooooo: 'noooooo' }; // hack to create nonempty obj
          this.deepCopyInto(firstObj[key], element);
          delete firstObj['noooooo'];
        }
      }
    }
  }

  leafletPopup(feature, layer) {
    const timeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    };
    // does this feature have a property named popupContent?
    if (feature.properties) {
      let text = '<table>';
      for (let [key, value] of Object.entries(feature.properties)) {
        let v = value;
        if (key == 'Date') {
          v = value['toLocaleDateString']('de-DE', timeFormatOptions);
        } else if (key.endsWith('lat') || key.endsWith('lon')) {
          v = Math.round(Number(value) * 1000000) / 1000000;
        } else if (Number.isFinite(Number(value))) {
          v = Math.round(Number(value) * 1000) / 1000;
        }
        text += '<tr><th>' + key + ':</th><td>' + v + '</td></tr>';
      }
      text += '</table>';
      layer.bindPopup(text);
    }
  }
  intToIPv4(intip: string) {
    const ip_i = parseInt(intip);
    const hex_str = ip_i.toString(16);
    return (
      Math.floor(ip_i / 16777216).toString(10) +
      '.' +
      parseInt(hex_str.substr(2, 2), 16).toString(10) +
      '.' +
      parseInt(hex_str.substr(4, 2), 16).toString(10) +
      '.' +
      parseInt(hex_str.substr(6, 2), 16).toString(10)
    );
  }

  // https://medium.com/swlh/how-to-round-to-a-certain-number-of-decimal-places-in-javascript-ed74c471c1b8
  roundAccurately(nr, decPlaces) {
    if (isNaN(nr)) {
      return nr;
    }
    if (nr < 1e-5 || nr > 1e5) {
      //accurate version breaks if "e" already in String display
      const round_amount = Math.pow(10, decPlaces);
      return Math.round(nr * round_amount) / round_amount;
    }
    return Number(
      Math.round(Number(String(nr) + 'e' + String(decPlaces))) +
      'e-' +
      String(decPlaces)
    );
  }

  // from https://medium.com/@thunderroid/angular-short-number-suffix-pipe-1k-2m-3b-dded4af82fb4
  shortenNumber(nr: number, rounder = 10): string {
    if (isNaN(nr)) return 'NaN';
    if (nr === null) return 'null';
    if (nr === 0) return '0';
    let abs = Math.abs(nr);
    const isNegative = nr < 0; // will also work for Negative numbers
    let key = '';

    const powers = [
      { key: 'E', value: 10e15 },
      { key: 'T', value: 10e12 },
      { key: 'G', value: 10e9 },
      { key: 'M', value: 10e6 },
      { key: 'K', value: 1000 },
    ];

    for (let i = 0; i < powers.length; i++) {
      let reduced = abs / powers[i].value;
      reduced = Math.round(reduced * rounder) / rounder;
      if (reduced >= 1) {
        abs = reduced;
        key = powers[i].key;
        break;
      }
    }
    return (isNegative ? '-' : '') + abs + ' ' + key; // " " is a thin space
  }

  formatFieldName(fieldname) {
    fieldname = fieldname.replace(/H2O_/, 'H₂O_');
    fieldname = fieldname.replace(/CO2_/, 'CO₂_');
    fieldname = fieldname.replace(/NO2_/, 'NO₂_');
    fieldname = fieldname.replace(/O3_/, 'O₃_');
    fieldname = fieldname.replace(/O3[+]/, 'O₃ / ');
    fieldname = fieldname.replace(/NH3_/, 'NH₃_');
    fieldname = fieldname.replace(/H2_/, 'H₂_');
    fieldname = fieldname.replace(/percent$/, '%');
    fieldname = fieldname.replace(/_%/, '-%');
    fieldname = fieldname.replace(/degC$/, '°C');
    fieldname = fieldname.replace(/_mlps$/, ' ( ml / s )');
    fieldname = fieldname.replace(/_lpm$/, ' ( l / min )');
    fieldname = fieldname.replace(/deg$/, '°'); // heading
    fieldname = fieldname.replace(/hdop/, 'HDOP');
    fieldname = fieldname.replace(/p([0-9.]*)_ppcm3$/, '$1 µm ( # / cm³ )');
    fieldname = fieldname.replace(/p([0-9.]*)_ugpm3$/, 'pm$1 ( µg / m³ )'); //spaces in () are thin-spaces
    fieldname = fieldname.replace(/_ugpm3$/, ' ( µg / m³ )');
    fieldname = fieldname.replace(/_gpm3$/, ' ( g / m³ )');
    fieldname = fieldname.replace(/_degps$/, ' ( ° / s )');
    fieldname = fieldname.replace(/_mps2$/, ' ( m / s² )');
    fieldname = fieldname.replace(/_mps$/, ' ( m / s )');
    fieldname = fieldname.replace(/uT$/, 'µT');
    fieldname = fieldname.replace(/dewPoint/, 'dew point');
    fieldname = fieldname.replace(/gps_view/, '#');
    fieldname = fieldname.replace(/air_rel/, 'apparent wind');
    fieldname = fieldname.replace(/_cps$/, ' ( # / s )');
    fieldname = fieldname.replace(/_Svph$/, ' ( Sv / h )');
    // fieldname = fieldname.replace(/interval_s/, 'interval ( s )'); // not a field, but a tag

    fieldname = fieldname.replace(/_([^_\s]+)$/, ' ( $1 )');
    fieldname = fieldname.replace(/_/, ' ');
    return fieldname;
  }
  /**
   *
   * @param tagarray array of k/v combinations, human readable: ['k1: v1', ...]
   * @param priorities str-arr
   */
  createSortedTagString(tagarray, priorities = ['sensor', 'id', 'channel']) {
    const tagarrayCopy = [...tagarray].sort();
    let seriesArray = []
    for (const prio of priorities) {
      for (let i = 0; i < tagarrayCopy.length; i++) {
        const tag = tagarrayCopy[i];
        if (tag.startsWith(prio)) {
          seriesArray.push(tag)
          tagarrayCopy.splice(i, 1)
          break;
        }
      }
    }
    // remainder
    for (const tag of tagarrayCopy) {
      seriesArray.push(tag)
    }
    return seriesArray.join(', ')
  }
  /**

   *
   * @param data [][] in dygraph Data format
   * @param origAnnoTsMS Unix Timestamp to search for, in ms.
   * @returns Unix TS in ms, a timestamp of the array or undefined if error
   */
  findNearestDataTS(data, origAnnoTsMS) {
    let firstindex = 0;
    const datalen = data.length;
    let lastindex = datalen - 1;
    let firstts, lastts;

    let timeoutcounter = 0;
    while (timeoutcounter++ < 99) {
      firstts = data[firstindex][0].valueOf();
      if (firstts == origAnnoTsMS) {
        return origAnnoTsMS;
      }
      lastts = data[lastindex][0].valueOf();
      if (lastts == origAnnoTsMS) {
        return origAnnoTsMS;
      }
      if (firstindex == lastindex - 1) { // timestamp to search lies between two points
        const half_ts = firstts + ((lastts - firstts) / 2);
        if (origAnnoTsMS > half_ts) {
          return lastts; // round up
        }
        return firstts // round down
      }
      const new_half_index = firstindex + Math.floor((lastindex - firstindex) / 2);
      const new_half_index_ts = data[new_half_index][0].valueOf()
      if (origAnnoTsMS < new_half_index_ts) {
        lastindex = new_half_index;
      } else {
        firstindex = new_half_index;
      }
    }
    const logoffset = data[0][0].valueOf();
    console.log(
      'findNearestDataTS: not found,',
      timeoutcounter,
      'firsti:',
      firstindex,
      'lasti:',
      lastindex,
      'firstts',
      (firstts - logoffset) / 1000,
      'target',
      (origAnnoTsMS - logoffset) / 1000,
      'lastts',
      (lastts - logoffset) / 1000
    );
    return undefined;
  }
  bigQconfirm(nr_points) {
    if (
      window.confirm(
        'Database would be queried for up to ' +
        Math.ceil(nr_points).toLocaleString() +
        ' points of data, are you sure?'
      )
    ) {
      return true;
    } else {
      console.log('user canceled query with', nr_points, 'points.');
      return false;
    }
  }
  calcMean(secondsRange, graphWidth) {
    const divider = Math.floor(secondsRange / graphWidth);
    return divider > 1 ? divider : 1;
  }

  /**
   * changes this.fromTime, from, toTime, to, currentRange, userMeanS, interval !!!
   */
  updateFromToTimes(timearray, myself, interval = '') {
    myself.fromTime = new Date(timearray[0]);
    myself.from = timearray[0];
    myself.toTime = new Date(timearray[1]);
    myself.to = timearray[1];
    const rangeSeconds = Math.floor((timearray[1] - timearray[0]) / 1000);
    myself.currentRange = this.createHRTimeString(rangeSeconds);
    if (!interval) {
      myself.userMeanS = this.calcMean(rangeSeconds, myself.graphWidth);
      myself.interval = String(myself.userMeanS);
    } else {
      myself.userMeanS = Number(interval);
    }
  }

  /**
   * @param column regex to match which columns are unified
   */
  unifyColumns(column, data, Pshort_labels, Praw_labels, labelBlackListT = []) {
    console.log('unifyColumns with', column);

    const short_labels = cloneDeep(Pshort_labels);
    const new_short_labels = [];
    const raw_labels = cloneDeep(Praw_labels)
    const new_raw_labels = [];

    let newdata = [];

    const indizes_to_merge = [];
    let first_index = -1;
    for (let l = 1; l < raw_labels.length; l++) {
      const label = raw_labels[l];
      if (!Object.prototype.hasOwnProperty.call(label, 'field')) {
        continue
      }
      const fieldname = label.field;
      // console.log('label:', label);

      if (fieldname.match(column)) {
        console.log('unifyColumns found',);
        indizes_to_merge.push(l);
        if (first_index == -1) {
          first_index = l
        }
      }
    }
    for (let i = 0; i < indizes_to_merge.length; i++) {
      const clabel = short_labels[indizes_to_merge[i] - 1];
      console.log('to merge:', clabel);
    }
    console.log('indizes_to_merge', indizes_to_merge);


    for (let c = 0; c < raw_labels.length; c++) {

      if (c == 0) { // time column
        for (let r = 0; r < data.length; r++) {
          newdata.push([data[r][0]])
        }
        new_raw_labels.push(raw_labels[0])
        // short_labes dont have date column
        continue
      }
      if (c == first_index) {
        for (let r = 0; r < data.length; r++) {
          const old_row = data[r];
          let new_nr = NaN;
          for (let i = 0; i < indizes_to_merge.length; i++) {
            let index = indizes_to_merge[i]
            let cvalue = old_row[index]
            if (!isNaN(cvalue) && cvalue != null) {
              new_nr = cvalue;
              break; // take first valid datapoint
            }
          }
          newdata[r].push(new_nr)
        }
        // merge labels
        const new_common_tags = cloneDeep(raw_labels[indizes_to_merge[0]].tags)
        const new_raw_label = { 'metric': raw_labels[indizes_to_merge[0]].metric, 'tags': new_common_tags, 'field': raw_labels[indizes_to_merge[0]].field }
        for (let i = 1; i < indizes_to_merge.length; i++) {
          const index = indizes_to_merge[i];
          const tags = raw_labels[index].tags;
          for (const common_key in new_common_tags) {
            if (!Object.prototype.hasOwnProperty.call(tags, common_key) || new_common_tags[common_key] != tags[common_key]) {
              delete new_common_tags[common_key];
            }
          }
        }
        new_raw_labels.push(new_raw_label);
        let new_short_label = new_raw_label.metric + ' merged: true, '
        for (const key in new_common_tags) {
          if (Object.prototype.hasOwnProperty.call(new_common_tags, key) && !labelBlackListT.includes(key)) {
            const value = new_common_tags[key];
            new_short_label += key + ': ' + value + ', '
          }
        }
        new_common_tags['merged'] = 'true';
        new_short_label += short_labels[first_index].split(/[,]+/).pop().trim();
        new_short_labels.push(new_short_label)
        continue;
      }
      if (indizes_to_merge.includes(c)) {
        continue; // they have already been handled above
      }

      // push remaining rows
      for (let r = 0; r < data.length; r++) {
        const old_row = data[r];
        newdata[r].push(old_row[c])
      }
      new_raw_labels.push(raw_labels[c])
      new_short_labels.push(short_labels[c - 1])
    }

    return { "data": newdata, "raw_labels": new_raw_labels, "short_labels": new_short_labels }
  }

  convVtoPPB(data: Array<any>, Praw_labels: Array<Object>, Pshort_labels: Array<string>) {

    // V = (WE - WE_zero) - (AE - AE_zero)
    // V = WE - AE - WE_zero + AE_zero
    // V = WE - AE + (AE_zero - WE_zero)
    const calfactors = {
      '212460428': { // Sensor serial nr.
        'offset': 0.002, // AE_zero - WE_zero
        'factor': 4550 // 4.55 *1000 for mV - V   : 1000 / sensitivity [mV/ppb] = ppb/V
      },
      '202180519': { // NO2-B43F bfg-lcair
        'offset': 0.232 - 0.228,
        'WE_zero': 0.228,
        'AE_zero': 0.232,
        'factor': 1000 / 0.207 // ppb/V
      },
      '204831253': { // OX bfg-lcair
        'offset': 0.225 - 0.240,
        'WE_zero': 0.240,
        'AE_zero': 0.225,
        'factor': 1000 / 0.354,
        'NO2_sensitivity': -607.06, // nA / ppm
        'gain': -0.73 // mV / nA
      },
      '162830053': { // CO bfg-lcair
        'offset': 0.332 - 0.352,
        'WE_zero': 0.352,
        'AE_zero': 0.332,
        'factor': 1000 / 0.493
      },
      '160910951': { // NO bfg-lcair
        'offset': 0.276 - 0.278,
        'WE_zero': 0.278,
        'AE_zero': 0.276,
        'factor': 1000 / 0.645
      }
    }

    const raw_labels = cloneDeep(Praw_labels)
    const short_labels = cloneDeep(Pshort_labels)
    // 1. search for all _V source inputs
    const V_columns = []; // {'c': $nr_column, 'gas': "$gas_string", 'serial': $nr }
    for (let i = 1; i < raw_labels.length; i++) { // col 0: Date
      const clabel = raw_labels[i];
      const field = clabel['field'];
      if (clabel['metric'] != 'gas' || !field.endsWith('_V'))
        continue;
      const gas = field.replace(/_V$/, '').replace(/^mean_/, '').replace(/_[WA]E$/, '')
      if (!gas || gas.length == 0)
        continue;
      // console.log('convVtoPPB found gas field', field, 'in column', clabel);
      const gastags = clabel['tags'];
      let serial = '';
      if (Object.prototype.hasOwnProperty.call(gastags, 'serial')) {
        serial = gastags['serial']
      } else {
        console.log('convVtoPPB Fault: gas has no serial');
        continue
      }
      let v_col = { 'c': i, 'gas': gas.toUpperCase(), 'serial': serial }
      if (field.endsWith('E_V')) {
        v_col['channeltype'] = field.substr(-4, 2)
      } else {
        v_col['channeltype'] = 'diff'
      }
      V_columns.push(v_col);
    }
    console.log("Voltage columns:", V_columns);

    for (let i = 0; i < V_columns.length; i++) {
      const gas_item = V_columns[i];

      if (gas_item['gas'] == 'O3+NO2')
        continue; // is handeled after all others, when NO2 is computed

      const serial = gas_item['serial']
      const factor = calfactors[serial]['factor']
      const new_raw_column_label = cloneDeep(raw_labels[gas_item['c']])

      if (gas_item['channeltype'] == 'diff') {
        const offset = calfactors[serial]['offset']
        console.log('convVtoPPB', gas_item['gas'], 'serial', serial, 'o', this.roundAccurately(offset, 4), 'f', this.roundAccurately(factor, 3));

        new_raw_column_label['field'] = new_raw_column_label['field'].replace(/_V/, "_ppb")
        new_raw_column_label['tags']['SRC'] = 'computed'
        raw_labels.push(new_raw_column_label);

        short_labels.push(short_labels[gas_item['c'] - 1]
          .replace('( V )', "( ppb )")
          .replace('serial:', 'SRC: computed, serial:')); // hacky way to modify text

        let first = true;
        for (let r = 0; r < data.length; r++) {
          const row = data[r];
          const g = row[gas_item['c']];
          let gas_ppb = NaN;
          if (Number.isFinite(g)) {
            gas_ppb = (g + offset) * factor
            if (first == true) {
              console.log('first gas V:', g, 'ppb', gas_ppb);
              first = false;
            }
          }
          row.push(gas_ppb)
        }
      } else if (gas_item['channeltype'] == 'WE') {
        new_raw_column_label['field'] = new_raw_column_label['field'].replace(/_WE_V/, "_ppb")
        new_raw_column_label['tags']['SRC'] = 'diff'
        raw_labels.push(new_raw_column_label);

        const new_diff_column_label = cloneDeep(raw_labels[gas_item['c']])
        new_diff_column_label['field'] = new_diff_column_label['field'].replace(/_WE_V/, "_V")
        new_diff_column_label['tags']['SRC'] = 'diff'
        raw_labels.push(new_diff_column_label);

        const WE_index = gas_item['c']
        short_labels.push(short_labels[WE_index - 1]
          .replace(' WE ( V )', " ( ppb )")
          .replace('serial:', 'SRC: diff, serial:')); // hacky way to modify text
        short_labels.push(short_labels[WE_index - 1]
          .replace(' WE ( V )', " ( V )")
          .replace('serial:', 'SRC: diff, serial:')); // hacky way to modify text

        // search for AE column
        let AE_index = NaN;
        for (let j = 0; j < V_columns.length; j++) {
          const AE_col = V_columns[j]
          if (AE_col['serial'] == serial && AE_col['channeltype'] == "AE") {
            AE_index = AE_col['c'];
            break
          }
        }

        const WE_zero = calfactors[serial]['WE_zero']
        const AE_zero = calfactors[serial]['AE_zero']
        let first = true;
        for (let r = 0; r < data.length; r++) {
          const row = data[r];
          const WE = row[WE_index];
          const AE = row[AE_index];
          let gas_ppb = NaN;
          let gas_diff_V = NaN;
          if (Number.isFinite(WE) && Number.isFinite(AE)) {
            gas_diff_V = (WE - WE_zero) - (AE - AE_zero)
            gas_ppb = gas_diff_V * factor
            if (first == true) {
              console.log('first gas', gas_item['gas'], 'ppb', gas_ppb);
              first = false;
            }
          }
          row.push(gas_ppb)
          row.push(gas_diff_V)
        }
      } // AE is handled above
    }

    // O3
    for (let i = 0; i < V_columns.length; i++) {
      const gas_item = V_columns[i];
      if (gas_item['gas'] != 'O3+NO2')
        continue;

      const serial = gas_item['serial']
      const factor = calfactors[serial]['factor']
      const new_raw_column_label = cloneDeep(raw_labels[gas_item['c']])
      if (gas_item['channeltype'] == 'diff') {
        const offset = calfactors[serial]['offset']
        console.log('convVtoPPB OX serial', serial, 'o', this.roundAccurately(offset, 4), 'f', this.roundAccurately(factor, 3));
        new_raw_column_label['field'] = new_raw_column_label['field'].replace(/O3\+NO2_V/, "O3_ppb")
        new_raw_column_label['tags']['SRC'] = 'computed'
        raw_labels.push(new_raw_column_label);

        short_labels.push(short_labels[gas_item['c'] - 1]
          .replace('O₃ / NO₂ ( V )', "O₃ ( ppb )")
          .replace('serial:', 'SRC: computed, serial:')); // hacky way to modify text

        const NO2_sensitivity = calfactors[serial]['NO2_sensitivity'] * calfactors[serial]['gain'] / 1000000 // -> V/ppb
        console.log("OX sensor NO2_sensitivity:", NO2_sensitivity, 'V/ppb');

        const OX_index = gas_item['c']
        // search for NO2 column
        let NO2_index = NaN;
        for (let j = 0; j < raw_labels.length; j++) {
          const NO2_col = raw_labels[j]
          if (NO2_col['field'] == "NO2_ppb") {
            // console.log('found NO col', NO2_col);
            NO2_index = j;
            break
          }
        }

        let first = false;
        for (let r = 0; r < data.length; r++) {
          const row = data[r];
          const OX = row[OX_index];

          if (Number.isFinite(OX) && Number.isFinite(row[NO2_index])) {
            const NO2_V = row[NO2_index] * NO2_sensitivity
            if (first == false) {
              console.log('gas_V:', OX, 'NO2_V', NO2_V);
              first = true;
            }
            const O3_V = OX - NO2_V
            row.push(O3_V * factor)
          } else
            row.push(NaN)
        }

      } else if (gas_item['channeltype'] == 'WE') {
        new_raw_column_label['field'] = new_raw_column_label['field'].replace(/O3\+NO2_WE_V/, "O3_ppb")
        new_raw_column_label['tags']['SRC'] = 'diff'
        raw_labels.push(new_raw_column_label);

        const new_diff_column_label = cloneDeep(raw_labels[gas_item['c']])
        new_diff_column_label['field'] = new_diff_column_label['field'].replace(/_WE_V/, "_V")
        new_diff_column_label['tags']['SRC'] = 'diff'
        raw_labels.push(new_diff_column_label);

        const WE_index = gas_item['c']
        short_labels.push(short_labels[WE_index - 1]
          .replace('O₃ / NO₂ WE ( V )', "O₃ ( ppb )")
          .replace('serial:', 'SRC: diff, serial:')); // hacky way to modify text
        short_labels.push(short_labels[WE_index - 1]
          .replace('O₃ / NO₂ WE ( V )', "O₃ / NO₂ ( V )")
          .replace('serial:', 'SRC: diff, serial:')); // hacky way to modify text

        // search for AE column
        let AE_index = NaN;
        for (let j = 0; j < V_columns.length; j++) {
          const AE_col = V_columns[j]
          if (AE_col['serial'] == serial && AE_col['channeltype'] == "AE") {
            AE_index = AE_col['c'];
            break
          }
        }
        const WE_zero = calfactors[serial]['WE_zero']
        const AE_zero = calfactors[serial]['AE_zero']
        const NO2_sensitivity = calfactors[serial]['NO2_sensitivity'] * calfactors[serial]['gain'] / 1000000 // -> V/ppb
        console.log("OX sensor NO2_sensitivity:", NO2_sensitivity, 'V/ppb');

        // search for NO2 column
        let NO2_index = NaN;
        for (let j = 0; j < raw_labels.length; j++) {
          const NO2_col = raw_labels[j]
          if (NO2_col['field'] == "NO2_ppb") {
            // console.log('found NO col', NO2_col);
            NO2_index = j;
            break
          }
        }

        let first = false;
        for (let r = 0; r < data.length; r++) {
          const row = data[r];
          const WE = row[WE_index];
          const AE = row[AE_index];
          let gas_ppb = NaN;
          let gas_alldiff_V = NaN;
          if (Number.isFinite(WE) && Number.isFinite(AE)) {
            gas_alldiff_V = (WE - WE_zero) - (AE - AE_zero)
            const NO2_V = row[NO2_index] * NO2_sensitivity
            if (first == false) {
              console.log('gas_V:', gas_alldiff_V, 'NO2_V', NO2_V);
              first = true;
            }
            const O3_V = gas_alldiff_V - NO2_V
            gas_ppb = O3_V * factor
          }
          row.push(gas_ppb)
          row.push(gas_alldiff_V)
        }
      }

    }
    return { 'data': data, 'short_labels': short_labels, 'raw_labels': raw_labels }
  }
  mol_masses = { 'NO2': 46.0055, 'CO': 28.010, 'NO': 30.006, 'O3': 47.997 }
  gas_constant = 8.314472
  convPPBtoUGPM3(data: Array<any>, Praw_labels: Array<Object>, Pshort_labels: Array<string>) {
    let T = 5;
    let tK = T + 273.15
    let P = 970;
    let factors = {}
    for (const gas in this.mol_masses) {
      if (Object.prototype.hasOwnProperty.call(this.mol_masses, gas)) {
        const mm = this.mol_masses[gas];
        factors[gas] = 0.1 * mm / this.gas_constant
      }
    }

    const ppb_columns = [];
    const raw_labels = cloneDeep(Praw_labels)
    const short_labels = cloneDeep(Pshort_labels)
    let t_col = undefined;
    let p_col = undefined;

    for (let i = 1; i < raw_labels.length; i++) { // col 0: Date
      const clabel = raw_labels[i];
      if (clabel['metric'] == 'pressure' && clabel['field'] == 'air_hPa') {
        p_col = i
        continue
      }
      if (clabel['metric'] == 'temperature' && clabel['field'] == 'air_degC') {
        t_col = i
        continue
      }
      if (clabel['metric'] != 'gas' || !clabel['field'].endsWith('_ppb'))
        continue;
      const gas = clabel['field'].replace(/_ppb$/, '').replace(/^mean_/, '')
      if (!gas || gas.length == 0)
        continue;
      if (!Object.prototype.hasOwnProperty.call(this.mol_masses, gas)) {
        console.log('convPPBtoUGPM3 Fault: no molar mass for', gas);
        continue
      }
      console.log('convPPBtoUGPM3 found gas', gas, 'in column', clabel);

      ppb_columns.push({ 'c': i, 'gas': gas.toUpperCase() });
    }
    if (t_col || p_col) {
      console.log('using temperature from col', t_col, 'and pressure from col', p_col);
    }

    let first = false;
    for (let i = 0; i < ppb_columns.length; i++) {
      const gas_item = ppb_columns[i];
      const gas = gas_item['gas']
      const mol_mass = this.mol_masses[gas]
      const factor = factors[gas]
      console.log('convPPBtoUGPM3', gas, 'has mol mass', mol_mass);

      const new_raw_column_label = cloneDeep(raw_labels[gas_item['c']])
      new_raw_column_label['field'] = new_raw_column_label['field'].replace(/_ppb/, "_ugpm3")
      new_raw_column_label['tags']['SRC'] = 'computed'
      raw_labels.push(new_raw_column_label);
      short_labels.push(short_labels[gas_item['c'] - 1]
        .replace('( ppb )', "( µg / m³ )"))

      for (let r = 0; r < data.length; r++) {
        const row = data[r];
        const gas_ppb = row[gas_item['c']];
        if(p_col && !isNaN(row[p_col]) && row[p_col] != null) { // if no T or P data (happens if time res <1s), use last one (dont care in ms range)
          P = row[p_col]
        }
        if (t_col && !isNaN(row[t_col]) && row[t_col] != null) {
          T = row[t_col]
          tK = T + 273.15
        }
        let gas_ugpm3 = NaN
        if (Number.isFinite(gas_ppb)) {
          gas_ugpm3 = gas_ppb * P * factor / tK
          if (first == false) {
            console.log('g', gas, 'ppb', gas_ppb, 'µg', gas_ugpm3);
            first = true;
          }
        }
        row.push(gas_ugpm3)
      }
    }
    return { 'data': data, 'short_labels': short_labels, 'raw_labels': raw_labels }
  }
}
