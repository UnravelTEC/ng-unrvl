import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UtFetchdataService {
  constructor(private http: HttpClient) {}

  httpURL =
    'http://belinda.cgv.tugraz.at:9090/api/v1/query?query=co2{location="FuzzyLab",sensor="scd30"}';
  Config = {};

  getHTTPData(url : string) {
    var thisurl = (url) ? url : this.httpURL;
    return this.http.get(thisurl);
  }
}
