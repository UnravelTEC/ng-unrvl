import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UtFetchdataService {
  constructor(private http: HttpClient) { }

  httpURL =
    'http://belinda.cgv.tugraz.at:9090/api/v1/query?query=co2{location="FuzzyLab",sensor="scd30"}';
  Config = {};

  queryEndPoint = "http://belinda.cgv.tugraz.at:9090/api/v1/";
  queryDefaultStep: number = 1000; //ms

  getHTTPData(url: string) {
    var thisurl = (url) ? url : this.httpURL;
    return this.http.get(thisurl);
  }

  private buildRangeQuery(queryEndPoint: string, queryString: string, start: Date, end: Date, step) {
    return queryEndPoint + "query_range?query=" + queryString + "&start=" + start.toISOString() + "&end=" + end.toISOString() + "&step=" + step + "ms";
  }

  getRange(queryString: string, start: Date, end: Date, step = this.queryDefaultStep, queryEndPoint = this.queryEndPoint) {

    return this.http.get(this.buildRangeQuery(queryEndPoint, queryString, start, end, step));
  }
}
