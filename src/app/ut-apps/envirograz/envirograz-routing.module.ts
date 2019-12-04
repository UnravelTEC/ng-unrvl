import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EnvirograzComponent } from './envirograz.component';const routes: Routes = [ { path: '', component: EnvirograzComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EnvirograzRoutingModule { }
