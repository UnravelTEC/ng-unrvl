import { CommonModule } from '@angular/common';
import {
  ModuleWithProviders,
  NgModule,
  Optional,
  SkipSelf
} from '@angular/core';
import { GlobalSettingsService } from './global-settings.service';
import { HelperFunctionsService } from './helper-functions.service';
import { LocalStorageService } from './local-storage.service';

// from https://stackoverflow.com/questions/39890722/provide-core-singleton-services-module-in-angular-2
@NgModule({
  imports: [CommonModule],
  providers: [
    LocalStorageService,
    HelperFunctionsService,
    GlobalSettingsService
  ],
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

  static forRoot(): ModuleWithProviders<CoreModule> {
    return {
      ngModule: CoreModule,
      providers: [
        LocalStorageService,
        HelperFunctionsService,
        GlobalSettingsService
      ]
    };
  }
}
