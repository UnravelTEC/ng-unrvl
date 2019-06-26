import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Bme280Component } from './bme280.component';const routes: Routes = [ { path: '', component: Bme280Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Bme280RoutingModule { }
