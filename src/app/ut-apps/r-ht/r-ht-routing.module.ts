import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RHTComponent } from './r-ht.component';


const routes: Routes = [
  {
    path: '',
    component: RHTComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RHTRoutingModule { }
