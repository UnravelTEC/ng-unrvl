import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { Co2Component } from './co2.component';

const routes: Routes = [
  {
    path: '',
    component: Co2Component
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Co2RoutingModule { }
