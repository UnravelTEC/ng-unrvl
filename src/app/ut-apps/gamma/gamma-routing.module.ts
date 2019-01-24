import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GammaComponent } from './gamma.component';

const routes: Routes = [ { path: '', component: GammaComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GammaRoutingModule { }
