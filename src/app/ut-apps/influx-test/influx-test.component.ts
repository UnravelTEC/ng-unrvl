import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';
import * as Paho from 'paho-mqtt';

@Component({
  selector: 'app-influx-test',
  templateUrl: './influx-test.component.html',
  styleUrls: ['./influx-test.component.scss']
})
export class InfluxTestComponent implements OnInit {
  private client;
  clientID = 'clientID_' + String(Math.random() * 100);

  public mqttMessages = 'empty';

  public sensorData = {};
  public sensorDataExample = {
    myBME: {
      temperature_degC: {
        index: {
          value: 25.5,
          tags: { id: '0x77' }
        }
      },

      pressure_hPA: {
        index: {
          value: 900,
          tags: { id: '0x77' }
        }
      },
      humidity_rel_percent: {
        index: {
          value: 42,
          tags: { id: '0x77' }
        }
      }
    }
  };

  constructor(
    private globalSettings: GlobalSettingsService,
    private utHTTP: UtFetchdataService
  ) {
    this.globalSettings.emitChange({ appName: 'influx-test' });
  }
  ngOnInit() {
    //let call = 'http://' + this.globalSettings.getHostName() + '.lan:8086/ping';
    const q = 'SELECT LAST(value_1),* FROM "voltage_V" GROUP BY *';
    let call =
      'http://' +
      this.globalSettings.getHostName() +
      '.lan:8086/query?db=telegraf&epoch=ms&q=' +
      q;
    console.log('calling', call);

    this.utHTTP
      .getHTTPData(call)
      .subscribe((data: Object) => this.printResult(data));

    this.client = new Paho.Client(
      this.globalSettings.getHostName() + '.lan',
      1885,
      this.clientID
    );
    this.client.onConnectionLost = this.onConnectionLost;
    this.client.onMessageArrived = this.onMessageArrived;
    document['MQTT_CLIENT'] = this.client;
    document['MQTT_CLIENT']['father'] = this;
    console.log('onInit', this.client);
    this.client.connect({
      onSuccess: this.onConnect,
      onFailure: this.onFailure
    });
  }

  printResult(data: Object) {
    console.log(data);
  }

  onConnect() {
    console.log('onConnect');
    console.log(this);

    document['MQTT_CLIENT'].subscribe('+/sensors/#');
  }

  onMessageArrived(message: Object) {
    const father = document['MQTT_CLIENT']['father'];

    const arr = message['topic'].split('/');
    const sensor = arr[2];
    const metric = arr[3];
    // console.log('got MQTT message from sensor ', sensor, ' about ', metric);
    try {
      const payload = JSON.parse(message['payloadString']);
      const value = payload['value'];
      let tags = JSON.parse(message['payloadString']);
      delete tags['value'];
      const index = JSON.stringify(tags);

      // console.log(payload);
      if (!father.sensorData[sensor]) {
        father.sensorData[sensor] = {};
      }
      if(!father.sensorData[sensor][metric]) {
        father.sensorData[sensor][metric] = {}
      }
      father.sensorData[sensor][metric][index] = { value: value, tags: tags };
    } catch (err) {
      console.error(err);
    }
  }

  onFailure(message) {
    console.error('MQTT failure on connect');
    console.error(message);
  }
  onConnectionLost(responseObject) {
    console.error('onConnectionLost object: ', responseObject);
    if (responseObject.errorCode !== 0) {
      console.error('onConnectionLost:', responseObject.errorMessage);
    }
  }
}
