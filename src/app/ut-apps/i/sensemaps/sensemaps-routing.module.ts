import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SensemapsComponent } from './sensemaps.component';
const routes: Routes = [{ path: '', component: SensemapsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SensemapsRoutingModule {}
