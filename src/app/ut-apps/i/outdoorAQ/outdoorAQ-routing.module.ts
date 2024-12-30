import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { outdoorAQComponent } from './outdoorAQ.component';const routes: Routes = [ { path: '', component: outdoorAQComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class outdoorAQRoutingModule { }
