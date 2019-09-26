import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IesComponent } from './ies.component';const routes: Routes = [ { path: '', component: IesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IesRoutingModule { }
