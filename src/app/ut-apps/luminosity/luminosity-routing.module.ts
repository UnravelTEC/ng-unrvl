import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LuminosityComponent } from './luminosity.component';const routes: Routes = [ { path: '', component: LuminosityComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LuminosityRoutingModule { }
