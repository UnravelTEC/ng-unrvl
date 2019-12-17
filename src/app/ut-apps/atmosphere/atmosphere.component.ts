import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';

@Component({
  selector: 'app-atmosphere',
  templateUrl: './atmosphere.component.html',
  styleUrls: ['./atmosphere.component.scss']
})
export class AtmosphereComponent implements OnInit {
  // source: https://en.wikipedia.org/wiki/Trace_gas
  gasses = [
    {
      name: 'Nitrogen',
      formular: 'N₂',
      estPPM: 78.084 * 10000,
      molarMass: 2 * 14.0067,
      density: 1.25
    },
    {
      name: 'Oxygen',
      formular: 'O₂',
      estPPM: 20.946 * 10000,
      molarMass: 2 * 15.999,
      density: 1.429
    },
    {
      name: 'Water Vapor',
      formular: 'H₂O',
      estPPM: 10000,
      molarMass: 18.01528,
      density: 0.00485
    },
    {
      name: 'Argon',
      formular: 'Ar',
      estPPM: 9340,
      molarMass: 39.88,
      density: 1.784
    },
    {
      name: 'Carbon Dioxide',
      formular: 'CO₂',
      estPPM: 415,
      molarMass: 44.009,
      density: 1.977
    },
    { name: 'Neon', formular: 'Ne', estPPM: 18.18, molarMass: 0, density: 0 },
    { name: 'Helium', formular: 'He', estPPM: 5.24, molarMass: 0, density: 0 },
    { name: 'Methane', formular: 'CH₄', estPPM: 1.8, molarMass: 0, density: 0 },
    { name: 'Hydrogen', formular: 'H₂', estPPM: 0.56, molarMass: 0, density: 0 },
    { name: 'Laughing Gas', formular: 'N₂O', estPPM: 0.33, molarMass: 0, density: 0 },
    {
      name: 'Volatile Organic Compounds',
      formular: '"VOC"',
      estPPM: 0.1,
      molarMass: 0,
      density: 0
    },
    { name: 'Carbon Monoxyde', formular: 'CO', estPPM: 0.12, molarMass: 0, density: 0 },
    {
      name: 'Ozone',
      formular: 'O₃',
      estPPM: 0.025,
      molarMass: 47.997,
      density: 2.144
    },
    { name: 'Formaldehyde', formular: 'HCHO', estPPM: 0.001, molarMass: 0, density: 0 },
    { name: 'Nitrogen Dioxide', formular: 'NO₂', estPPM: 0.001, molarMass: 46.006, density: 1.880 },

    { name: 'Ammonia', formular: 'NH₃', estPPM: 0.0001, molarMass: 0, density: 0 },
    { name: 'Sulfur Dioxide', formular: 'SO₂', estPPM: 0.0001, molarMass: 0, density: 0 }
    // { name: '', formular: '', estPPM: 0, molarMass: 0, density: 0 }
  ];

  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'Atmospheric Composition' });
  }
  ngOnInit() {}
}
