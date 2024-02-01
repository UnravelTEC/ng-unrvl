import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtDygraphScatterComponent } from './ut-dygraph-scatter.component';
import { dygNrPipe } from './ut-dygraph-number.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatInputModule,
    MatIconModule,
    MatRadioModule
  ],
  declarations: [UtDygraphScatterComponent, dygNrPipe],
  exports: [UtDygraphScatterComponent]
})
export class UtDygraphScatterModule {}
