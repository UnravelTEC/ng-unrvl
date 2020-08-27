import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PmhistComponent } from './pmhist.component';const routes: Routes = [ { path: '', component: PmhistComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PmhistRoutingModule { }
