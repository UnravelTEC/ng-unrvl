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

registerLocaleData(localeDe, 'de');

const appRoutes: Routes = [
  {
    path: 'Settings',
    loadChildren: () => import('./ut-settings/ut-settings.module').then(m => m.UtSettingsModule)
  },
  {
    path: 'Settings/Services',
    loadChildren: () => import('./ut-settings/services/services.module').then(m => m.ServicesModule)
  },
  {
    path: 'Dashboard',
    loadChildren: () => import('./ut-dashboard/ut-dashboard.module').then(m => m.UtDashboardModule)
  },
  {
    path: 'Apps/vif',
    loadChildren: () => import('./ut-apps/vif/vif.module').then(m => m.VifModule)
  },
  {
    path: 'Apps/IAQ',
    loadChildren: () => import('./ut-apps/iaq/iaq.module').then(m => m.IaqModule)
  },
  {
    path: 'Apps/Humidity',
    loadChildren: () => import('./ut-apps/humidity/humidity.module').then(m => m.HumidityModule)
  },
  {
    path: 'Apps/Atmosphere',
    loadChildren: () => import('./ut-apps/atmosphere/atmosphere.module').then(m => m.AtmosphereModule)
  },
  {
    path: 'Apps/ADC',
    loadChildren: () => import('./ut-apps/adc/adc.module').then(m => m.AdcModule)
  },
  {
    path: 'Apps/ADC-Diff',
    loadChildren: () => import('./ut-apps/adc-diff/adc-diff.module').then(m => m.AdcDiffModule)
  },
  {
    path: 'Apps/CO2',
    loadChildren: () => import('./ut-apps/co2/co2.module').then(m => m.Co2Module)
  },
  {
    path: 'Apps/Airquality',
    loadChildren: () => import('./ut-apps/airq/airq.module').then(m => m.AirqModule)
  },
  {
    path: 'Apps/CO2-graph',
    loadChildren: () => import('./ut-apps/co2-graph/co2-graph.module').then(m => m.Co2GraphModule)
  },
  {
    path: 'Apps/Ozone',
    loadChildren: () => import('./ut-apps/ozone/ozone.module').then(m => m.OzoneModule)
  },
  {
    path: 'Apps/rHT',
    loadChildren: () => import('./ut-apps/r-ht/r-ht.module').then(m => m.RHTModule)
  },
  {
    path: 'Apps/UV',
    loadChildren: () => import('./ut-apps/uv/uv.module').then(m => m.UvModule)
  },
  {
    path: 'Apps/PressureGraph',
    loadChildren:
      () => import('./ut-apps/pressure-graph/pressure-graph.module').then(m => m.PressureGraphModule)
  },
  {
    path: 'Apps/PM',
    loadChildren: () => import('./ut-apps/pm/pm.module').then(m => m.PmModule)
  },
  {
    path: 'Apps/PM-Analyzer',
    loadChildren: () => import('./ut-apps/pm-analyzer/pm-analyzer.module').then(m => m.PmAnalyzerModule)
  },
  {
    path: 'Apps/Flicker',
    loadChildren: () => import('./ut-apps/flicker/flicker.module').then(m => m.FlickerModule)
  },
  {
    path: 'Apps/voc',
    loadChildren: () => import('./ut-apps/voc/voc.module').then(m => m.VocModule)
  },
  {
    path: 'Apps/voc-raw',
    loadChildren: () => import('./ut-apps/voc-raw/voc.module').then(m => m.VocModule)
  },
  {
    path: 'Apps/loudness',
    loadChildren: () => import('./ut-apps/loudness/loudness.module').then(m => m.LoudnessModule)
  },
  {
    path: 'Apps/Luminosity',
    loadChildren: () => import('./ut-apps/luminosity/luminosity.module').then(m => m.LuminosityModule)
  },
  {
    path: 'Apps/noir',
    loadChildren: () => import('./ut-apps/noir/noir.module').then(m => m.NoirModule)
  },
  {
    path: 'Apps/gamma',
    loadChildren: () => import('./ut-apps/gamma/gamma.module').then(m => m.GammaModule)
  },
  {
    path: 'Apps/Power',
    loadChildren: () => import('./ut-apps/power/power.module').then(m => m.PowerModule)
  },
  {
    path: 'Apps/Sensors',
    loadChildren: () => import('./ut-apps/sensors/sensors.module').then(m => m.SensorsModule)
  },
  {
    path: 'Apps/Sensors/SCD30',
    loadChildren: () => import('./ut-apps/sensors/scd30/scd30.module').then(m => m.Scd30Module)
  },
  {
    path: 'Apps/Sensors/SPS30',
    loadChildren: () => import('./ut-apps/sensors/sps30/sps30.module').then(m => m.Sps30Module)
  },
  {
    path: 'Apps/Sensors/SGP30',
    loadChildren: () => import('./ut-apps/sensors/sgp30/sgp30.module').then(m => m.Sgp30Module)
  },
  {
    path: 'Apps/Sensors/DS18B20',
    loadChildren: () => import('./ut-apps/sensors/ds18b20/ds18b20.module').then(m => m.Ds18b20Module)
  },
  {
    path: 'Apps/Sensors/BME280',
    loadChildren: () => import('./ut-apps/sensors/bme280/bme280.module').then(m => m.Bme280Module)
  },
  {
    path: 'Apps/Sensors/TSL2561',
    loadChildren: () => import('./ut-apps/sensors/tsl2561/tsl2561.module').then(m => m.Tsl2561Module)
  },

  {
    path: 'Apps/Sensors/TYPE5',
    loadChildren: () => import('./ut-apps/sensors/type5/type5.module').then(m => m.Type5Module)
  },
  {
    path: 'Apps/Sensors/MPU9250',
    loadChildren: () => import('./ut-apps/sensors/mpu9250/mpu9250.module').then(m => m.Mpu9250Module)
  },
  {
    path: 'Apps/Sensors/MICS6814',
    loadChildren: () => import('./ut-apps/sensors/mics6814/mics6814.module').then(m => m.Mics6814Module)
  },
  {
    path: 'Apps/Sensors/TGS5141',
    loadChildren: () => import('./ut-apps/sensors/tgs5141/tgs5141.module').then(m => m.Tgs5141Module)
  },
  {
    path: 'Apps/Sensors/SGAS',
    loadChildren: () => import('./ut-apps/sensors/sgas/sgas.module').then(m => m.SgasModule)
  },
  {
    path: 'Apps/Sensors/NO2-B43F',
    loadChildren:
      () => import('./ut-apps/sensors/no2-b43f/no2-b43f.module').then(m => m.No2B43fModule)
  },
  {
    path: 'Apps/Sensors/Alphasense-gas',
    loadChildren:
      () => import('./ut-apps/sensors/galion-alphasense/galion-alphasense.module').then(m => m.GalionAlphasenseModule)
  },
  {
    path: 'Apps/Sensors/TCS34725',
    loadChildren: () => import('./ut-apps/sensors/tcs34725/tcs34725.module').then(m => m.Tcs34725Module)
  },
  {
    path: 'Apps/Temperatures',
    loadChildren:
      () => import('./ut-apps/temperatures/temperatures.module').then(m => m.TemperaturesModule)
  },
  {
    path: 'Apps/Dygraph-Playground',
    loadChildren: () => import('./ut-apps/dygraph-dev/dygraph-dev.module').then(m => m.DygraphDevModule)
  },
  {
    path: 'Apps/Influx-Test',
    loadChildren: () => import('./ut-apps/influx-test/influx-test.module').then(m => m.InfluxTestModule)
  },
  {
    path: 'Apps/MQTT-Test',
    loadChildren: () => import('./ut-apps/mqtt/mqtt.module').then(m => m.MqttModule)
  },
  {
    path: 'Apps/Galion',
    loadChildren: () => import('./ut-apps/galion/galion.module').then(m => m.GalionModule)
  },
  {
    path: 'Apps/Galion-Vif',
    loadChildren: () => import('./ut-apps/galion-vif/galion-vif.module').then(m => m.GalionVifModule)
  },
  {
    path: 'Apps/IES',
    loadChildren: () => import('./ut-apps/ies/ies.module').then(m => m.IesModule)
  },
  {
    path: 'Apps/EnviroGraz000',
    loadChildren: () => import('./ut-apps/envirograz/envirograz.module').then(m => m.EnvirograzModule)
  },
  {
    path: 'Apps/I/Bimbox001',
    loadChildren: () => import('./ut-apps/i/bimbox/bimbox.module').then(m => m.BimboxModule)
  },
  {
    path: 'Apps/System',
    loadChildren: () => import('./ut-apps/system/system.module').then(m => m.SystemModule)
  },
  {
    path: 'Apps/Weihnachtsvorlesung',
    loadChildren:
      () => import('./ut-apps/weihnachtsvorlesung/weihnachtsvorlesung.module').then(m => m.WeihnachtsvorlesungModule)
  },
  {
    path: 'Apps/I/Radiation',
    loadChildren:
      () => import('./ut-apps/i/radiation/radiation.module').then(m => m.RadiationModule)
  },
  {
    path: 'Apps/I/Pressure',
    loadChildren:
      () => import('./ut-apps/i/pressure/pressure.module').then(m => m.PressureModule)
  },
  {
    path: 'Apps/I/IndoorClimate',
    loadChildren:
      () => import('./ut-apps/i/indoorclimate/indoorclimate.module').then(m => m.IndoorclimateModule)
  },
  {
    path: 'Apps/I/CPU',
    loadChildren:
      () => import('./ut-apps/i/coretemps/coretemps.module').then(m => m.CoretempsModule)
  },
  {
    path: 'Apps/I/EnviroOne',
    loadChildren:
      () => import('./ut-apps/i/enviroone/enviroone.module').then(m => m.EnvirooneModule)
  },
  {
    path: 'Apps/I/Pmhist',
    loadChildren:
      () => import('./ut-apps/i/pmhist/pmhist.module').then(m => m.PmhistModule)
  },
  {
    path: 'Apps/I/Luftdaten',
    loadChildren:
      () => import('./ut-apps/i/luftdaten/luftdaten.module').then(m => m.LuftdatenModule)
  },
  {
    path: 'Apps/I/Allsens',
    loadChildren:
      () => import('./ut-apps/i/allsens/allsens.module').then(m => m.AllsensModule)
  },
  {
    path: 'Apps/I/Anysens',
    loadChildren:
      () => import('./ut-apps/i/anysens/anysens.module').then(m => m.AnysensModule)
  },
  {
    path: '',
    redirectTo: 'Dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    loadChildren: () => import('./ut-dashboard/ut-dashboard.module').then(m => m.UtDashboardModule)
  }
];

@NgModule({
  declarations: [AppComponent, TopBarComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatIconModule,
    HttpClientModule,
    CoreModule.forRoot(),
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: false } // !environment.production
    )
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'de' }, Title],
  bootstrap: [AppComponent]
})
export class AppModule {}
