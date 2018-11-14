import { BrowserModule, Title } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';

import { RouterModule, Routes } from '@angular/router';
import { TopBarComponent } from './top-bar/top-bar.component';

import { NgDygraphsModule } from 'ng-dygraphs';


const appRoutes: Routes = [
  {
    path: 'Settings',
    loadChildren: './ut-settings/ut-settings.module#UtSettingsModule'
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
    path: 'Apps/CO2',
    loadChildren: './ut-apps/co2-graph/co2-graph.module#Co2GraphModule'
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
    HttpClientModule,
    NgDygraphsModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true } // <-- debugging purposes only
    )
  ],
  providers: [Title],
  bootstrap: [AppComponent]
})
export class AppModule {}
