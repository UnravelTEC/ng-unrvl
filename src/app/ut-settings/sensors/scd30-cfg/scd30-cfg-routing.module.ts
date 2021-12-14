import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Scd30CfgComponent } from './scd30-cfg.component';
const routes: Routes = [{ path: '', component: Scd30CfgComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class Scd30CfgRoutingModule {}
