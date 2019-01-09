import { Injectable } from '@angular/core';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class HelperFunctionsService {
  domainAndApp = '';
  domain = '';

  constructor(private loc: Location) {
    const url = window.location.href;
    const angularRoute = this.loc.path();
    this.domainAndApp = url.replace(angularRoute, '');
    this.domain = this.domainAndApp.replace(/:[0-9]*$/, '').replace(/[?]/,'');
  }

  getBaseURL() {
    return this.domain;
  }

  getDeep(obj: Object, argumentsArray: Array<any>): any {
    if (!obj) {
      console.error('getDeep: !obj');
      return undefined;
    }
    while (argumentsArray.length) {
      let currentIndex = argumentsArray.shift();
      if (obj[currentIndex]) {
        obj = obj[currentIndex];
      } else {
        return undefined;
      }
    }
    return obj;
  }
}
