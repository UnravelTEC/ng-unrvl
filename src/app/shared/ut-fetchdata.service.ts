import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class UtFetchdataService {
  constructor(private http: HttpClient) {}

  httpURL =
    'http://belinda.cgv.tugraz.at:9090/api/v1/query?query=co2{location="FuzzyLab",sensor="scd30"}';
  Config = {};

  queryEndPoint = 'http://belinda.cgv.tugraz.at:9090/api/v1/';
  queryDefaultStep = 1000; // ms

  getHTTPData(url: string) {
    const thisurl = url ? url : this.httpURL;
    return this.http.get(thisurl);
  }

  private buildRangeQuery(
    queryEndPoint: string,
    queryString: string,
    start: Date,
    end: Date,
    step
  ) {
    const url =
      queryEndPoint +
      'query_range?query=' +
      queryString +
      '&start=' +
      start.toISOString() +
      '&end=' +
      end.toISOString() +
      '&step=' +
      step +
      'ms';
    // console.log(url);
    return url;
  }

  getRange(
    queryString: string,
    start: Date,
    end: Date,
    step = this.queryDefaultStep,
    queryEndPoint = this.queryEndPoint
  ) {
    // console.log(start);
    // console.log(end);
    return this.http.get(
      this.buildRangeQuery(queryEndPoint, queryString, start, end, step)
    );
  }
  postData(url: string, data: any) {
    this.http.post(url, data).subscribe(
      (res: any) => {
        console.log(res);
      },
      (error: any) => {
        console.log(error);
      }
    );

    console.log(['postData', url, data]);
  }
}
