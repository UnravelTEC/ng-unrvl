import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HostsRoutingModule } from './hosts-routing.module';
import { HostsComponent } from './hosts.component';

@NgModule({
  imports: [
    CommonModule,
    HostsRoutingModule
  ],
  declarations: [HostsComponent]
})
export class HostsModule { }
