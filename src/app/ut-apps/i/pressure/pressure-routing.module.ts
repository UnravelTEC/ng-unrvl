import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PressureComponent } from './pressure.component';const routes: Routes = [ { path: '', component: PressureComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PressureRoutingModule { }
