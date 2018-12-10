import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HelperFunctionsService {
  constructor() {}

  getDeep(obj: Object, argumentsArray: Array<any>): any {
    if(!obj) {
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
