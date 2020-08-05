import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EnviromapComponent } from './enviromap.component';const routes: Routes = [ { path: '', component: EnviromapComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EnviromapRoutingModule { }
