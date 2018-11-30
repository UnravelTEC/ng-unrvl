import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WeihnachtsvorlesungComponent } from './weihnachtsvorlesung.component'

const routes: Routes = [
  {
    path: '',
    component: WeihnachtsvorlesungComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WeihnachtsvorlesungRoutingModule { }
