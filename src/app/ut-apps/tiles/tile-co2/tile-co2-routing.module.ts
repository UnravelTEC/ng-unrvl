import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TileCo2Component } from './tile-co2.component';const routes: Routes = [ { path: '', component: TileCo2Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TileCo2RoutingModule { }
