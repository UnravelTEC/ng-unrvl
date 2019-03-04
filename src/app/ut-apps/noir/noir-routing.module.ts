import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NoirComponent } from './noir.component';
const routes: Routes = [{ path: '', component: NoirComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NoirRoutingModule {}
