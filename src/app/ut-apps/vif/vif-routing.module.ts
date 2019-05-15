import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VifComponent } from './vif.component';const routes: Routes = [ { path: '', component: VifComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VifRoutingModule { }
