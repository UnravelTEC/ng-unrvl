import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dygNr'
})
export class dygNrPipe implements PipeTransform {
  transform(value: number | string, locale?: string): string {
    let myval = Number(value);
    let digits = 2;
    let result = '';

    if (
      myval !== 0.0 &&
      (Math.abs(myval) >= Math.pow(10, 5) ||
        Math.abs(myval) < Math.pow(10, -digits))
    ) {
      result = myval.toExponential(digits);
      result = result.replace('+', '');
    } else {
      if (myval > 1000 || myval < -100) {
        if (myval > 10000 || myval < -1000) {
          digits = 0;
        } else digits = 1;
      }

      const shift = Math.pow(10, digits);
      result = String(Math.round(myval * shift) / shift);
    }
    return result;
  }
}
