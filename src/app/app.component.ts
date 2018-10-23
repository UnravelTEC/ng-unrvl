import { Component, OnInit } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'TFrontend';
  prod = environment.production;
  restMsg = '';

  constructor(private http: HttpClient) {
  }

  ngOnInit() {
    this.http.get('/rest/test').subscribe(value => {
      this.restMsg = value['msg'];
    }, error => {
      this.restMsg = error.message;
    });
  }
}
