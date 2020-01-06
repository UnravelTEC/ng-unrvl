import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FlickerComponent } from './flicker.component';const routes: Routes = [ { path: '', component: FlickerComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FlickerRoutingModule { }
