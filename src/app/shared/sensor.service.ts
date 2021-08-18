import { Injectable } from '@angular/core';
import { HelperFunctionsService } from 'app/core/helper-functions.service';

@Injectable({
  providedIn: 'root',
})
export class SensorService {
  private Devs = {
    Bosch: {
      T: function (value) {
        if (value === null) return null;
        if (isNaN(value) || value > 85 || value < -40) {
          return NaN;
        }

        if (value > 20 && value < 30) {
          // guess, only spec. at 25°C
          const delta_rel = Math.abs(value - 25) / 5;
          return [
            value - 0.5 - 0.5 * delta_rel,
            value,
            value + 0.5 + 0.5 * delta_rel,
          ];
        }
        let dev = 1; // °
        if (value > 0 && value < 65) {
          return [value - dev, value, value + dev];
        }
        // TODO not specified outside 0..65°C
        dev = 2; // guess
        return [value - dev, value, value + dev];
      },
      P: function (value) {
        if (value === null) return null;
        if (isNaN(value) || value > 1100 || value < 300) { // abs. max would be 20000 hPa ?
          return NaN;
        }
        const dev = 1; // hPa
        // TODO dev = 1.7 hPa if T < 0
        // TODO Log term stability ±1 hPA / Year 0..65°C
        return [value - dev, value, value + dev];
      },
    },
  };
  public sensorPresets = {
    DS18B20: {
      '*_degC': {
        min: -55,
        max: 125,
        resolution_b: 16,
        step: 0.0625, // 1/16°C
        round_digits: 2,
        getDeviation: function (value) {
          if (value === null) {
            return null;
          }
          if (isNaN(value) || value > 125 || value < -55) {
            return NaN;
          }
          if (value > 0 && value < 70) {
            // according to Datasheet for VDD > 4.3V
            return [value - 0.5, value, value + 0.5];
          }
          if (value >= 85) {
            return [value - (1 + (value - 85) / 20), value, value + 1];
          }
          if (value >= 70) {
            return [value - 1, value, value + 1];
          }
          if (value <= 0) {
            return [value - 1, value, value + (1 + (-value / 55) * 4)];
          }
        },
      },
    },
    BME280: {
      '*_degC': {
        round_digits: 2,
        getDeviation: this.Devs.Bosch.T,
      },
      H2O_rel_percent: {
        round_digits: 2,
        getDeviation: function (value, envParams = { T_degC: 25, age_d: 42 }) {
          if (value === null) return null;
          if (isNaN(value) || value > 100 || value < 0) {
            return NaN;
          }
          if (
            value > 80 ||
            value < 20 ||
            envParams.T_degC < -40 ||
            envParams.T_degC > 85
          ) {
            return [value, value, value];
          }

          const dev = 3; // %
          // TODO Log term stability ±0.5 % / Year 10...90%
          // TODO hysteresis ±1%
          // TODO nonlinearity 1%
          // TODO operating range datasheet p.9
          return [value - dev, value, value + dev];
        },
      },
      air_hPa: {
        round_digits: 3,
        getDeviation: this.Devs.Bosch.P,
      },
    },
    BMP280: {
      '*_degC': {
        round_digits: 2,
        getDeviation: this.Devs.Bosch.T,
      },
      air_hPa: {
        round_digits: 3,
        getDeviation: this.Devs.Bosch.P,
      },
    },
    SCD30: {
      CO2_ppm: {
        round_digits: 1,
        getDeviation: function (value, T = 25) {
          if (T === undefined) T = 25;
          if (value === null) return null;
          if (isNaN(value) || value > 40000 || value < 0) {
            return NaN;
          }
          if (T < 0 || T > 50) {
            return [value, value, value];
          }
          // TODO accuracy drift ±50ppm over lifetime (15Y)
          // TODO 2.5ppm/K temperature instability
          const dev = 30 + value * 0.03;
          return [value - dev, value, value + dev];
        },
      },
      sensor_degC: {
        round_digits: 1,
        getDeviation: function (value) {
          if (value === null) return null;
          if (isNaN(value) || value > 120 || value < -40) {
            return NaN;
          }
          if (value < 0 || value > 50) {
            return [value, value, value];
          }
          const dev = 0.4 + 0.023 * (value - 25);
          return [value - dev, value, value + dev];
        },
      },
    },
    MPU9250: {
      sensor_degC: {
        round_digits: 1,
      },
    },
    'OPC-N3': {
      sensor_degC: {
        round_digits: 1,
      },
      humidity_rel_percent: {
        round_digits: 0,
      },
      '*_ugpm3': {
        round_digits: 1,
      },
    },
    'PT1000': {
      '*_degC': {
        // PT1000: 0.15%
        // R am Board  0.1%
        // ADC: https://datasheets.maximintegrated.com/en/ds/MAX31865.pdf
        // 15bit, spannungsteiler 1:4.3
        // The output data is the ratio of the sensor resistance
        // Page1: Nominal Temperature Resolution 0.03125 K
        // Page3: ADC Full-Scale Error: ±1LSB, ADC Integral Nonlinearity: ±1LSB, ADC Offset Error: ±3LSB -> ±0.25°C (Table p20)
        // Page6: ~±0.02K ADC Conversion error

        round_digits: 3,
        getDeviation: function (value) {
          if (value === null) return null;
          if (isNaN(value) || value > 550 || value < -200) {
            return NaN;
          }
          // DIN EN 60751: https://temperatur-profis.de/wissen/temperaturfuehler/genauigkeit-pt100-pt1000/
          // PLUS ADC uncertainty of ±0.25K

          // class 0.10% (AA)
          // const din_offset = 0.1;
          // const din_mult = 0.0017
          // class 0.15% (A)
          const din_offset = 0.15;
          const din_mult = 0.002;
          const adc_offset = 0.25; // ca. between -30 and 40°C TODO formula
          const sum_offset = din_offset + adc_offset;
          const dev = sum_offset + din_mult * value;
          return [value - dev, value, value + dev];
        },
      }
    },
    GPS: {
      lat: {
        round_digits: 7,
      },
      lon: {
        round_digits: 7,
      },
      heading_deg: {
        round_digits: 0,
      },
      height_m_sea: {
        round_digits: 0,
      },
      height_m_wgs84: {
        round_digits: 0,
      },
      sats_gps_view: {
        round_digits: 1,
      },
    },
    'NO2-B43F': {
      NO2_ppm: {
        round_digits: 4,
      },
      NO2_ugpm3: {
        round_digits: 1,
      },
      '*_degC': {
        round_digits: 1,
      },
    },
    ADS1115: {
      resolution_mV: {
        round_digits: 3,
      },
      maxrange_V: {
        round_digits: 3,
      },
      gain: {
        round_digits: 0,
      },
      averaged_count: {
        round_digits: 0,
      },
      ch12_V: {
        round_digits: 4,
      },
      ch34_V: {
        round_digits: 4,
      },
      ch1_V: {
        round_digits: 4,
      },
      ch2_V: {
        round_digits: 4,
      },
      ch3_V: {
        round_digits: 4,
      },
      ch4_V: {
        round_digits: 4,
      },
    },
    DB: {
      '*db': {
        round_digits: 0,
      },
    },
    RS04: {
      total_Svph: {
        round_digits: 10,
      },
      sensor_highvoltage_V: {
        round_digits: 1,
      },
      sensor_voltage_V: {
        round_digits: 1,
      },
      total_cps: {
        round_digits: 1,
      },
      '*_degC': {
        round_digits: 1,
      },
      sensor_current_mA: {
        round_digits: 0,
      },
    },
  };
  constructor(private h: HelperFunctionsService) {}

  // FIXME a better place for this function would be nice, but depends on sensorPresets
  roundSensorValue(value, raw_label = {}) {
    return this.h.roundAccurately(value, this.getDigits(raw_label));
  }
  getDigits(raw_label) {
    const retval = this.getSensorPresetField(raw_label, 'round_digits');
    return retval !== undefined ? retval : 2;
  }
  getSensorPresetField(raw_label, fieldname) {
    const sensor = this.h.getDeep(raw_label, ['tags', 'sensor']);
    if (!sensor || !this.sensorPresets.hasOwnProperty(sensor)) return undefined;
    const sensorPreset = this.sensorPresets[sensor];
    const field = raw_label['field'].replace(/mean_/, ''); //optionally rm influx avg prefix
    for (const physParam in sensorPreset) {
      if (Object.prototype.hasOwnProperty.call(sensorPreset, physParam)) {
        const sensorProperties = sensorPreset[physParam];
        if (
          sensorProperties.hasOwnProperty(fieldname) &&
          (physParam == field ||
            (physParam.startsWith('*') && field.endsWith(physParam.slice(1))))
        ) {
          return sensorProperties[fieldname];
        }
      }
    }
    return undefined;
  }
  nullDevFun(value) {
    return [value, value, value];
  }
  getDeviationFunction(raw_label) {
    const defFun = this.getSensorPresetField(raw_label, 'getDeviation');
    return defFun ? defFun : this.nullDevFun;
  }
  returnDataWithDeviations(data, raw_labels): Array<Array<any>> {
    const nrcols = raw_labels.length;
    const deviFunctions = [null];
    const dataWithDev = [];
    for (let c = 1; c < nrcols; c++) {
      deviFunctions[c] = this.getDeviationFunction(raw_labels[c]);
    }

    for (let r = 0; r < data.length; r++) {
      const oldRow = data[r];
      let newRow = [oldRow[0]]; // Date
      for (let c = 1; c < nrcols; c++) {
        newRow.push(deviFunctions[c](oldRow[c]));
      }
      dataWithDev.push(newRow);
    }
    console.log(
      'calculated Deviation Data for',
      (nrcols - 1) * data.length,
      'points of',
      raw_labels
    );
    return dataWithDev;
  }
}