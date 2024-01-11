import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UtDashboardTileComponent } from './ut-dashboard-tile.component';

@NgModule({
    imports: [CommonModule, RouterModule],
    declarations: [UtDashboardTileComponent],
    exports: [UtDashboardTileComponent],
})
export class UtDashboardTileModule { }