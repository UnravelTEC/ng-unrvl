import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';
import { LocalStorageService } from 'app/core/local-storage.service';
import { isString } from 'util';

@Component({
  selector: 'app-humidity',
  templateUrl: './humidity.component.html',
  styleUrls: ['./humidity.component.scss']
})
export class HumidityComponent implements OnInit {
  step = 1000;
  startTime = '15m';
  graphstyleT = {
    position: 'absolute',
    top: '50%',
    bottom: '25%',
    left: '0px',
    right: '0px'
  };
  graphstylerH = {
    position: 'absolute',
    top: '75%',
    bottom: '0',
    left: '0',
    right: '0px'
  };

  extraDyGraphConfig = {
    pointSize: 1,
    highlightSeriesOpts: {
      strokeWidth: 1,
      strokeBorderWidth: 1,
      highlightCircleSize: 1
    }
    // legend: 'never'
  };
  labelBlackList = ['__name__', 'interval'];

  outsideT: number;
  outsideRH: number;
  outsideAH: number;
  outsideTD: number;
  temperatureOffset = '0';
  temperatureOffsetNumber: number;
  private variablesToSave = ['outsideT', 'outsideRH', 'temperatureOffset'];
  public dewPointTemp;
  public absoluteHumidity;

  constructor(
    private globalSettings: GlobalSettingsService,
    private localStorage: LocalStorageService
  ) {
    this.globalSettings.emitChange({ appName: 'Humidity' });
  }
  ngOnInit() {
    let valueInLocalStorage;
    this.variablesToSave.forEach(elementName => {
      valueInLocalStorage = this.localStorage.get(
        'app-humidity_' + elementName
      );
      if (valueInLocalStorage) {
        this[elementName] = valueInLocalStorage;
      }
    });
    if (!this.outsideT) this.outsideT = 10;
    if (!this.outsideRH) this.outsideRH = 50;
    if (!this.temperatureOffsetNumber)
      this.temperatureOffsetNumber = Number(this.temperatureOffset);

    this.dewPointTemp = 0;
    this.absoluteHumidity = 0;
    this.outsideAH = this.absHumidity(this.outsideT, this.outsideRH);
    this.outsideTD = this.dewPoint(this.outsideT, this.outsideRH);
  }
  isString(x) {
    return Object.prototype.toString.call(x) === '[object String]';
  }

  dewPoint(argT, argRH, P = 972) {
    const T = isString(argT) ? Number(argT) : argT;
    const rH = isString(argRH) ? Number(argRH) : argRH;

    // source: https://en.wikipedia.org/wiki/Dew_point#Calculating_the_dew_point
    // todo enhance with constants for different temperature sets
    let a: number, b: number, c: number, d: number;
    a = 6.1121; //mbar
    b = 18.678;
    c = 257.14; // °C
    d = 234.5; // °C

    const y_m = Math.log((rH / 100) * Math.exp((b - T / d) * (T / (c + T))));
    const T_dp = (c * y_m) / (b - y_m);
    this.dewPointTemp = T_dp;
    return T_dp;
  }
  absHumidity(argT, argRH) {
    const T = isString(argT) ? Number(argT) : argT;
    const rH = isString(argRH) ? Number(argRH) : argRH;
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
    const aH = 100000 * (m_w / R) * (DD / T_K);

    //=  10^5 * mw/R* * DD(r,T)/TK; AF(TD,TK) = 10^5 * mw/R* * SDD(TD)/TK
    // console.log('result:', aH);
    this.absoluteHumidity = aH;
    return aH; // g/m³
  }
  relHumidity(argT, argAH, argTD = this.dewPointTemp) {
    const T = isString(argT) ? Number(argT) : argT;
    const aH = isString(argAH) ? Number(argAH) : argAH;

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
  save() {
    this.variablesToSave.forEach(elementName => {
      this.localStorage.set('app-humidity_' + elementName, this[elementName]);
    });
  }
  updateRH(RH) {
    this.outsideRH = RH;
    this.outsideAH = this.absHumidity(this.outsideT, this.outsideRH);
    this.outsideTD = this.dewPoint(this.outsideT, this.outsideRH);
    this.save();
  }
  updateT(T) {
    this.outsideT = T;
    this.outsideAH = this.absHumidity(this.outsideT, this.outsideRH);
    this.outsideTD = this.dewPoint(this.outsideT, this.outsideRH);
    this.save();
  }
  updateTO(T) {
    this.temperatureOffset = T;
    this.temperatureOffsetNumber = Number(T);
    this.save();
  }
}
