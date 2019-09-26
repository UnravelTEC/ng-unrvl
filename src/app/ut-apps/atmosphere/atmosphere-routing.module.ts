import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AtmosphereComponent } from './atmosphere.component';const routes: Routes = [ { path: '', component: AtmosphereComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AtmosphereRoutingModule { }
