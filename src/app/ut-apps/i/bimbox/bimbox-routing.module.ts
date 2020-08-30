import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BimboxComponent } from './bimbox.component';
const routes: Routes = [{ path: '', component: BimboxComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BimboxRoutingModule {}
