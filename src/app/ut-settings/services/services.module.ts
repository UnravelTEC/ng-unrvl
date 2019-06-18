import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ServicesRoutingModule } from './services-routing.module';
import { ServicesComponent } from './services.component';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [
    CommonModule,
    ServicesRoutingModule,
    MatIconModule
  ],
  declarations: [ServicesComponent]
})
export class ServicesModule { }
