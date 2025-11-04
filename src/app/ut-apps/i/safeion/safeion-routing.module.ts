import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SafeionComponent } from './safeion.component';
const routes: Routes = [{ path: '', component: SafeionComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SafeionRoutingModule {}
