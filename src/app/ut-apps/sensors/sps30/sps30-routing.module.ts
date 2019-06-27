import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Sps30Component } from './sps30.component';const routes: Routes = [ { path: '', component: Sps30Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Sps30RoutingModule { }
