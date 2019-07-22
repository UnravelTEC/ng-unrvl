import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Sgp30Component } from './sgp30.component';const routes: Routes = [ { path: '', component: Sgp30Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Sgp30RoutingModule { }
