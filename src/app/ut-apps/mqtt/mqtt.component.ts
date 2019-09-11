import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import * as Paho from 'paho-mqtt';

@Component({
  selector: 'app-mqtt',
  templateUrl: './mqtt.component.html',
  styleUrls: ['./mqtt.component.scss']
})
export class MqttComponent implements OnInit, OnDestroy {
  status = 'init'; // | connecting | connected | failed | lost
  public disconnects = 0;
  private client;
  private clientID = 'clientID_' + String(Math.random() * 100);
  public topic = '+/sensors/#';

  public mqttMessages = [
    { date: new Date(), topic: 'sample topic', payload: 'sample payload' }
  ];
  public maxlen = 10;
  public updateMessages = true;

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

  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'MQTT-test' });
  }

  ngOnInit() {
    let server = this.globalSettings.server.serverName;
    console.log(server);

    this.client = new Paho.Client(server, 1885, this.clientID);
    this.client.onConnectionLost = this.onConnectionLost;
    this.client.onMessageArrived = this.onMessageArrived;
    document['MQTT_CLIENT'] = this.client;
    document['MQTT_CLIENT']['father'] = this;
    console.log('onInit', this.client);
    this.connect();
  }
  ngOnDestroy() {
    this.client.unsubscribe(this.topic, {});
  }
  connect() {
    this.client.connect({
      onSuccess: this.onConnect,
      onFailure: this.onFailure
    });
    this.status = 'connecting';
  }
  onConnect() {
    console.log('onConnect');
    console.log(this);
    const father = document['MQTT_CLIENT']['father'];
    document['MQTT_CLIENT'].subscribe(father.topic);
    father.status = 'connected';
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
      const TSString = tags['UTS'];
      delete tags['value'];
      delete tags['UTS'];
      const index = JSON.stringify(tags);

      // console.log(payload);
      if (!father.sensorData[sensor]) {
        father.sensorData[sensor] = {};
      }
      if (!father.sensorData[sensor][metric]) {
        father.sensorData[sensor][metric] = {};
      }
      father.sensorData[sensor][metric][index] = { value: value, tags: tags };

      if (father.updateMessages) {
        // console.log('msg:', message);

        let valueTimestamp = Number(TSString) * 1000;

        const sentDate =
          valueTimestamp > 0 ? new Date(valueTimestamp) : new Date();

        const msg = {
          date: sentDate,
          topic: message['topic'],
          payload: message['payloadString'],
          destinationName: message['destinationName'],
          qos: message['qos'],
          retained: message['retained']
        };

        father.mqttMessages.unshift(msg);
        if (father.mqttMessages.length > father.maxlen) {
          father.mqttMessages.pop();
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  onFailure(message) {
    console.error('MQTT failure on connect');
    console.error(message);
    document['MQTT_CLIENT']['father'].status = 'failed';
  }
  onConnectionLost(responseObject) {
    const father = document['MQTT_CLIENT']['father'];
    console.error('onConnectionLost object: ', responseObject);
    if (responseObject.errorCode !== 0) {
      console.error('onConnectionLost:', responseObject.errorMessage);
    }
    father.status = 'lost';
    father.disconnects += 1;
    father.connect();
  }
}
