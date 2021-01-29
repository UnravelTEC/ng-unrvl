import { Component, OnInit } from '@angular/core';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';
import { GlobalSettingsService } from '../../../core/global-settings.service';

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss'],
})
export class NetworkComponent implements OnInit {
  wifis = [];
  public wificlient_ssid = '';
  public wificlient_psk = '';

  constructor(
    public gss: GlobalSettingsService,
    private utHTTP: UtFetchdataService
  ) {}

  ngOnInit() {
    this.utHTTP
      .getHTTPData(this.gss.getAPIEndpoint() + 'system/wificlient.php?cmd=get')
      .subscribe((data: Object) => this.acceptWifi(data));
  }
  acceptWifi(data: Object) {
    console.log('acceptWifi:', data);
    if (data && data['success']) {
      this.wifis = data['networks'];
      this.wificlient_ssid = data['networks'][0]['ssid'];
      this.wificlient_psk = data['networks'][0]['psk'];
    } else {
      console.error(data);
      alert(JSON.stringify(data));
    }
    console.log(this.wifis);
    if (data['set']) {
      alert('Wifi credentials set successful - system will restart wifi!')
    }
  }
  setWifi() {
    if (this.wificlient_psk.length < 8) {
      alert('minimum PSK length: 8 chars');
      console.error('minimum PSK length: 8 chars')
      return;
    }
    if (this.wificlient_psk.length > 63) {
      alert('maximum PSK length: 63 chars');
      console.error('maximum PSK length: 63 chars');
      return;
    }
    if (this.wificlient_ssid.length < 1) {
      alert('minimum SSID length: 1 chars');
      console.error('minimum SSID length: 1 chars');
      return;
    }
    if (this.wificlient_ssid.length > 32) {
      alert('maximum SSID length: 32 chars');
      console.error('maximum SSID length: 32 chars');
      return;
    }
    this.utHTTP
      .getHTTPData(
        this.gss.getAPIEndpoint() +
          'system/wificlient.php?cmd=set&ssid=' +
          encodeURIComponent(this.wificlient_ssid) +
          '&psk=' +
          encodeURIComponent(this.wificlient_psk)
      )
      .subscribe((data: Object) => this.acceptWifi(data));
  }
}
