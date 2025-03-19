import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MICS6814Component } from './MICS6814.component';

const routes: Routes = [ { path: '', component: MICS6814Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MICS6814RoutingModule { }
