import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Mics6814Component } from './mics6814.component';const routes: Routes = [ { path: '', component: Mics6814Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Mics6814RoutingModule { }
