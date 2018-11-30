import { CommonModule } from '@angular/common';
import { NgModule, Optional, SkipSelf } from '@angular/core';

import { LocalStorageService } from './local-storage.service';


// from https://stackoverflow.com/questions/39890722/provide-core-singleton-services-module-in-angular-2
@NgModule({
  imports: [CommonModule],
  providers: [LocalStorageService],
  declarations: []
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule is already loaded. Import it in the AppModule only'
      );
    }
  }
}
