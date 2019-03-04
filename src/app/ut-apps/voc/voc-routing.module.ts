import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VocComponent } from './voc.component';
const routes: Routes = [{ path: '', component: VocComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VocRoutingModule {}
