import { HttpClientModule } from '@angular/common/http';
import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Routes } from '@angular/router';

import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';

import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { TopBarComponent } from './top-bar/top-bar.component';
import { environment } from '../environments/environment';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';

registerLocaleData(localeDe, 'de');

const appRoutes: Routes = [
  {
    path: 'Settings',
    loadChildren: () =>
      import('./ut-settings/ut-settings.module').then(
        (m) => m.UtSettingsModule
      ),
  },
  {
    path: 'Settings/Services',
    loadChildren: () =>
      import('./ut-settings/services/services.module').then(
        (m) => m.ServicesModule
      ),
  },
  {
    path: 'Dashboard',
    loadChildren: () =>
      import('./ut-dashboard/ut-dashboard.module').then(
        (m) => m.UtDashboardModule
      ),
  },
  {
    path: 'Apps/Flicker',
    loadChildren: () =>
      import('./ut-apps/flicker/flicker.module').then((m) => m.FlickerModule),
  },
  {
    path: 'Apps/noir',
    loadChildren: () =>
      import('./ut-apps/noir/noir.module').then((m) => m.NoirModule),
  },

  {
    path: 'Apps/Influx-Test',
    loadChildren: () =>
      import('./ut-apps/influx-test/influx-test.module').then(
        (m) => m.InfluxTestModule
      ),
  },
  {
    path: 'Apps/MQTT-Test',
    loadChildren: () =>
      import('./ut-apps/mqtt/mqtt.module').then((m) => m.MqttModule),
  },
  {
    path: 'Apps/CO2',
    loadChildren: () =>
      import('./ut-apps/co2/co2.module').then((m) => m.Co2Module),
  },
  {
    path: 'Apps/EnviroGraz000',
    loadChildren: () =>
      import('./ut-apps/envirograz/envirograz.module').then(
        (m) => m.EnvirograzModule
      ),
  },
  {
    path: 'Apps/I/Bimbox001',
    loadChildren: () =>
      import('./ut-apps/i/bimbox/bimbox.module').then((m) => m.BimboxModule),
  },
  {
    path: 'Apps/I/Radiation',
    loadChildren: () =>
      import('./ut-apps/i/radiation/radiation.module').then(
        (m) => m.RadiationModule
      ),
  },
  {
    path: 'Apps/I/Pressure',
    loadChildren: () =>
      import('./ut-apps/i/pressure/pressure.module').then(
        (m) => m.PressureModule
      ),
  },
  {
    path: 'Apps/I/IndoorClimate',
    loadChildren: () =>
      import('./ut-apps/i/indoorclimate/indoorclimate.module').then(
        (m) => m.IndoorclimateModule
      ),
  },
  {
    path: 'Apps/I/Humidity',
    loadChildren: () =>
      import('./ut-apps/i/humidity/humidity.module').then(
        (m) => m.HumidityModule
      ),
  },
  {
    path: 'Apps/I/CPU',
    loadChildren: () =>
      import('./ut-apps/i/coretemps/coretemps.module').then(
        (m) => m.CoretempsModule
      ),
  },
  {
    path: 'Apps/I/EnviroOne',
    loadChildren: () =>
      import('./ut-apps/i/enviroone/enviroone.module').then(
        (m) => m.EnvirooneModule
      ),
  },
  {
    path: 'Apps/I/Sensemaps',
    loadChildren: () =>
      import('./ut-apps/i/sensemaps/sensemaps.module').then(
        (m) => m.SensemapsModule
      ),
  },
  {
    path: 'Apps/I/Enviromap',
    loadChildren: () =>
      import('./ut-apps/i/enviromap/enviromap.module').then(
        (m) => m.EnviromapModule
      ),
  },
  {
    path: 'Apps/I/Pmhist',
    loadChildren: () =>
      import('./ut-apps/i/pmhist/pmhist.module').then((m) => m.PmhistModule),
  },
  {
    path: 'Apps/I/GPS',
    loadChildren: () =>
      import('./ut-apps/i/gps/gps.module').then((m) => m.GpsModule),
  },
  {
    path: 'Apps/I/Luftdaten',
    loadChildren: () =>
      import('./ut-apps/i/luftdaten/luftdaten.module').then(
        (m) => m.LuftdatenModule
      ),
  },
  {
    path: 'Apps/I/Allsens',
    loadChildren: () =>
      import('./ut-apps/i/allsens/allsens.module').then((m) => m.AllsensModule),
  },
  {
    path: 'Apps/I/Anysens',
    loadChildren: () =>
      import('./ut-apps/i/anysens/anysens.module').then((m) => m.AnysensModule),
  },

  {
    path: 'Apps/Sensors',
    loadChildren: () =>
      import('./ut-apps/sensors/sensors.module').then((m) => m.SensorsModule),
  },
  {
    path: 'Apps/Sensors/BME280',
    loadChildren: () =>
      import('./ut-apps/sensors/bme280/bme280.module').then(
        (m) => m.Bme280Module
      ),
  },
  {
    path: 'Apps/Sensors/SCD30',
    loadChildren: () =>
      import('./ut-apps/sensors/scd30/scd30.module').then((m) => m.Scd30Module),
  },
  {
    path: 'Apps/Sensors/SPS30',
    loadChildren: () =>
      import('./ut-apps/sensors/sps30/sps30.module').then((m) => m.Sps30Module),
  },
  {
    path: 'Apps/Sensors/DS18B20',
    loadChildren: () =>
      import('./ut-apps/sensors/ds18b20/ds18b20.module').then(
        (m) => m.Ds18b20Module
      ),
  },
  {
    path: 'Apps/Sensors/TSL2561',
    loadChildren: () =>
      import('./ut-apps/sensors/tsl2561/tsl2561.module').then(
        (m) => m.Tsl2561Module
      ),
  },
  {
    path: 'Apps/Calibrations',
    loadChildren: () =>
      import('./ut-apps/calibration/calibration.module').then(
        (m) => m.CalibrationModule
      ),
  },
  {
    path: '',
    redirectTo: 'Dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    loadChildren: () =>
      import('./ut-dashboard/ut-dashboard.module').then(
        (m) => m.UtDashboardModule
      ),
  },
];

@NgModule({
  declarations: [AppComponent, TopBarComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatIconModule,
    HttpClientModule,
    LeafletModule,
    CoreModule.forRoot(),
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: false } // !environment.production
    ),
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'de' }, Title],
  bootstrap: [AppComponent],
})
export class AppModule {}
