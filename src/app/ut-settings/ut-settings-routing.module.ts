import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SettingsPanelComponent } from './settings-panel/settings-panel.component';

const routes: Routes = [
  {
    path: '',
    component: SettingsPanelComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UtSettingsRoutingModule {}
