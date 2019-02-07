// from https://stackoverflow.com/questions/37662456/angular-2-output-from-router-outlet

import { Injectable, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';
import { HelperFunctionsService } from './helper-functions.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalSettingsService implements OnInit {
  private hostName = '';

  // Observable string sources
  private emitChangeSource = new Subject<any>();
  // Observable string streams
  changeEmitted$ = this.emitChangeSource.asObservable();
  // Service message commands
  emitChange(change: any) {
    this.emitChangeSource.next(change);
  }
  constructor(
    private utFetchdataService: UtFetchdataService,
    private h: HelperFunctionsService
  ) {}

  ngOnInit() {
    this.fetchHostName();
  }

  private fetchHostName() {
    this.utFetchdataService
      .getHTTPData(this.h.getBaseURL() + '/api/system/hostname.php')
      .subscribe((data: Object) => this.setHostName(data));
  }
  setHostName(data: Object) {
    if (data['hostname']) {
      this.hostName = data['hostName'];
    }
    this.emitChange({ hostname: this.hostName });
  }

  public getHostName(): string {
    return this.hostName;
  }
}
