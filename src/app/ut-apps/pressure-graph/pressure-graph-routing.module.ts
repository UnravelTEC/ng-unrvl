import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PressureGraphComponent } from './pressure-graph.component';

const routes: Routes = [
  {
    path: '',
    component: PressureGraphComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PressureGraphRoutingModule { }
