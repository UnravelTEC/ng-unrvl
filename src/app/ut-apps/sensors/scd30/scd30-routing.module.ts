import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Scd30Component } from './scd30.component';const routes: Routes = [ { path: '', component: Scd30Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Scd30RoutingModule { }
