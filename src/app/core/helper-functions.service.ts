import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { formatDate } from '@angular/common';
import * as FileSaver from 'file-saver';
import { cloneDeep } from 'lodash-es';

@Injectable({
  providedIn: 'root'
})
export class HelperFunctionsService {
  domainAndApp = '';
  domain = '';

  constructor(private loc: Location) {
    const url = window.location.href;
    const angularRoute = this.loc.path();
    this.domainAndApp = url.replace(angularRoute, '');
    this.domain = this.domainAndApp.replace(/:[0-9]*$/, '').replace(/[?]/, '');
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

  parseToSeconds(inputString: string): number {
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
        labelBlackList.forEach(item => {
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

  exportCSV(data, labels, utc = true) {
    // header
    const separator = '\t';
    const linebreak = '\n';
    const dummyDate = new Date();
    console.log('utc:', utc);

    let header = '';
    if (labels.length === 0 || data.length === 0) {
      alert('no data to export');
      return;
    }
    for (let i = 0; i < labels.length; i++) {
      const element = labels[i];
      if (i > 0) {
        header += separator;
      }
      header += element.replace(/,/g, ';');
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
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      for (let column = 0; column < row.length; column++) {
        const element = row[column];
        if (column > 0) {
          csvbody += separator;
        }
        if (column === 0) {
          csvbody += element.valueOf() / 1000;
          csvbody +=
            separator + (utc ? element.toUTCString() : element.toString());
        } else {
          csvbody += String(element);
        }
      }
      csvbody += linebreak;
    }
    // values

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

  isString(x) {
    return Object.prototype.toString.call(x) === '[object String]';
  }

  relHumidity(argT, argTD) {
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
    const SDDDP = 6.1078 * Math.pow(10, (a * argTD) / (b + argTD));
    const rH = (100 * SDDDP) / SDD;
    return rH;
  }
  absHumidity(argT, argRH) {
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
  dewPoint(argT, argRH, P = 972) {
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
}
