import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Tsl2561Component } from './tsl2561.component';const routes: Routes = [ { path: '', component: Tsl2561Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Tsl2561RoutingModule { }
