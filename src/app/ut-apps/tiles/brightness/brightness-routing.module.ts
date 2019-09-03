import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BrightnessComponent } from './brightness.component';const routes: Routes = [ { path: '', component: BrightnessComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BrightnessRoutingModule { }
