import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';
import { LocalStorageService } from 'app/core/local-storage.service';
import { HelperFunctionsService } from 'app/core/helper-functions.service';

@Component({
  selector: 'app-humidity',
  templateUrl: './humidity.component.html',
  styleUrls: ['./humidity.component.scss']
})
export class HumidityComponent implements OnInit {
  sensors = [
    { name: 'SCD30', query: '{sensor="SCD30"}' },
    { name: 'BME280 (any)', query: '{sensor="BME280"}' },
    { name: 'BME680 (any)', query: '{sensor="BME680"}' },
    { name: 'BME280 0x76', query: '{sensor="BME280",id="0x76"}' },
    { name: 'BME280 0x77', query: '{sensor="BME280",id="0x77"}' }
  ];
  sensorQuery = '';
  queryStringHumidityBase = 'humidity_rel_percent';
  queryStringHumidity = this.queryStringHumidityBase;
  queryStringTempBase = 'temperature_degC';
  queryStringTemp = this.queryStringTempBase;

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
  private variablesToSave = [
    'outsideT',
    'outsideRH',
    'temperatureOffset',
    'queryStringHumidity',
    'queryStringTemp',
    'sensorQuery'
  ];
  public dewPointTemp = 0;
  public absoluteHumidity = 0;
  public correctedHumidity = 0;
  public humidityAfterVenting = 0;

  constructor(
    private globalSettings: GlobalSettingsService,
    private localStorage: LocalStorageService,
    private h: HelperFunctionsService
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

  selectSensor() {
    this.queryStringTemp = this.queryStringTempBase + this.sensorQuery;
    this.queryStringHumidity = this.queryStringHumidityBase + this.sensorQuery;
    this.save();
  }

  dewPoint(argT, argRH) {
    this.dewPointTemp = this.h.dewPoint(argT, argRH);
    return this.dewPointTemp;
  }
  absHumidity(argT, argRH) {
    const aH = this.h.absHumidity(argT, argRH);
    this.absoluteHumidity = aH;
    return aH; // g/m³
  }

  relHumidity(argT, argTD = this.dewPointTemp) {
    const rH = this.h.relHumidity(argT, argTD);
    return rH;
  }
  calcCorrRH(temp) {
    this.correctedHumidity = this.h.relHumidity(temp, this.dewPointTemp);
    return this.correctedHumidity;
  }
  calcHumAfterVent(temp, dewPointTemp) {
    this.humidityAfterVenting = this.h.relHumidity(temp, dewPointTemp);
    return this.humidityAfterVenting;
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
  toNum(string_arg) {
    return Number(string_arg);
  }
}
