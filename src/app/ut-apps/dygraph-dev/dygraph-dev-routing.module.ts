import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DygraphDevComponent } from './dygraph-dev.component';

const routes: Routes = [
  {
    path: '',
    component: DygraphDevComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DygraphDevRoutingModule {}
