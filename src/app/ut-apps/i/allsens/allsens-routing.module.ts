import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AllsensComponent } from './allsens.component';const routes: Routes = [ { path: '', component: AllsensComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AllsensRoutingModule { }
