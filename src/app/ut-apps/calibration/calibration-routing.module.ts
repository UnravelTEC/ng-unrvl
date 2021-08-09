import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CalibrationComponent } from './calibration.component';const routes: Routes = [ { path: '', component: CalibrationComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CalibrationRoutingModule { }
