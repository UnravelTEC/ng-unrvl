import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EvaporatorComponent } from './evaporator.component';const routes: Routes = [ { path: '', component: EvaporatorComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EvaporatorRoutingModule { }
