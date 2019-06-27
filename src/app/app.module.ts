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
    loadChildren: './ut-settings/ut-settings.module#UtSettingsModule'
  },
  {
    path: 'Settings/Services',
    loadChildren: './ut-settings/services/services.module#ServicesModule'
  },
  {
    path: 'Dashboard',
    loadChildren: './ut-dashboard/ut-dashboard.module#UtDashboardModule'
  },
  {
    path: 'Apps/IAQ',
    loadChildren: './ut-apps/iaq/iaq.module#IaqModule'
  },
  {
    path: 'Apps/ADC',
    loadChildren: './ut-apps/adc/adc.module#AdcModule'
  },
  {
    path: 'Apps/CO2',
    loadChildren: './ut-apps/co2/co2.module#Co2Module'
  },
  {
    path: 'Apps/CO2-graph',
    loadChildren: './ut-apps/co2-graph/co2-graph.module#Co2GraphModule'
  },
  {
    path: 'Apps/rHT',
    loadChildren: './ut-apps/r-ht/r-ht.module#RHTModule'
  },
  {
    path: 'Apps/UV',
    loadChildren: './ut-apps/uv/uv.module#UvModule'
  },
  {
    path: 'Apps/PressureGraph',
    loadChildren: './ut-apps/pressure-graph/pressure-graph.module#PressureGraphModule'
  },
  {
    path: 'Apps/PM',
    loadChildren: './ut-apps/pm/pm.module#PmModule'
  },
  {
    path: 'Apps/voc',
    loadChildren: './ut-apps/voc/voc.module#VocModule'
  },
  {
    path: 'Apps/voc-raw',
    loadChildren: './ut-apps/voc-raw/voc.module#VocModule'
  },
  {
    path: 'Apps/loudness',
    loadChildren: './ut-apps/loudness/loudness.module#LoudnessModule'
  },
  {
    path: 'Apps/noir',
    loadChildren: './ut-apps/noir/noir.module#NoirModule'
  },
  {
    path: 'Apps/gamma',
    loadChildren: './ut-apps/gamma/gamma.module#GammaModule'
  },
  {
    path: 'Apps/Power',
    loadChildren: './ut-apps/power/power.module#PowerModule'
  },
  {
    path: 'Apps/Sensors',
    loadChildren: './ut-apps/sensors/sensors.module#SensorsModule'
  },
  {
    path: 'Apps/Sensors/SCD30',
    loadChildren: './ut-apps/sensors/scd30/scd30.module#Scd30Module'
  },
  {
    path: 'Apps/Sensors/SPS30',
    loadChildren: './ut-apps/sensors/sps30/sps30.module#Sps30Module'
  },
  {
    path: 'Apps/Sensors/DS18B20',
    loadChildren: './ut-apps/sensors/ds18b20/ds18b20.module#Ds18b20Module'
  },
  {
    path: 'Apps/Sensors/BME280',
    loadChildren: './ut-apps/sensors/bme280/bme280.module#Bme280Module'
  },
  {
    path: 'Apps/Temperatures',
    loadChildren: './ut-apps/temperatures/temperatures.module#TemperaturesModule'
  },
  {
    path: 'Apps/Dygraph-Playground',
    loadChildren: './ut-apps/dygraph-dev/dygraph-dev.module#DygraphDevModule'
  },
  {
    path: 'Apps/Weihnachtsvorlesung',
    loadChildren:
      './ut-apps/weihnachtsvorlesung/weihnachtsvorlesung.module#WeihnachtsvorlesungModule'
  },
  {
    path: '',
    redirectTo: 'Dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    loadChildren: './ut-dashboard/ut-dashboard.module#UtDashboardModule'
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
