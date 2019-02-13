import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NoirRoutingModule } from './noir-routing.module';
import { NoirComponent } from './noir.component';

@NgModule({
  imports: [
    CommonModule,
    NoirRoutingModule
  ],
  declarations: [NoirComponent]
})
export class NoirModule { }
