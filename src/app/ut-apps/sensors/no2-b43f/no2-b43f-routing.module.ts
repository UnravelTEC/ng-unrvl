import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { No2B43fComponent } from './no2-b43f.component';const routes: Routes = [ { path: '', component: No2B43fComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class No2B43fRoutingModule { }
