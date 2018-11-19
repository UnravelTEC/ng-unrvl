import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { Co2GraphComponent } from './co2-graph.component';

const routes: Routes = [
  {
    path: '',
    component: Co2GraphComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Co2GraphRoutingModule { }
