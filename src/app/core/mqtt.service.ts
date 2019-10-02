import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';

import * as Paho from 'paho-mqtt';
import { GlobalSettingsService } from './global-settings.service';

@Injectable({
  providedIn: 'root'
})
export class MqttService {
  /*
    loaded on 'boot'
      connect to broker

      users can subscribe to a topic, and get pushed the messages
  */

  // Observable string sources
  private emitChangeSource = new Subject<any>();
  // Observable string streams
  changeEmitted$ = this.emitChangeSource.asObservable();
  // Service message commands
  emitChange(change: any) {
    this.emitChangeSource.next(change);
  }

  private emitChangeSources = {};
  public observableTopics$ = {};
  private waitingTopics = [];

  private client;
  private clientID = 'clientID_' + String(Math.random() * 100);
  public status = 'init'; // | connecting | connected | failed | lost
  public disconnects = 0;

  constructor(private globalSettings: GlobalSettingsService) {
    document['MQTT_CLIENT'] = {};
    document['MQTT_CLIENT']['father'] = this;
    let server = this.globalSettings.server.serverName;
    if (server) {
      this.init();
    } else {
      console.log('mqtt: server not ready yet');
      setTimeout(
        function() {
          this.init();
        }.bind(this),
        50
      );
    }
  }
  init() {
    let server = this.globalSettings.server.serverName;
    if (!server) {
      console.log('mqtt: server not ready yet');
      setTimeout(
        function() {
          this.init();
        }.bind(this),
        50
      );
      return;
    }

    console.log('mqtt server:' + server);

    this.client = new Paho.Client(server, 1885, this.clientID);
    this.client.onConnectionLost = this.onConnectionLost;
    this.client.onMessageArrived = this.onMessageArrived;
    document['MQTT_CLIENT'] = this.client;
    document['MQTT_CLIENT']['father'] = this;
    console.log('MQTT client under construction', this.client);
    this.connect();
  }

  subscribeTopic(topic: string) {
    this.emitChangeSources[topic] = new Subject<any>();
    this.observableTopics$[topic] = this.emitChangeSources[
      topic
    ].asObservable();

    if (this.status === 'connected') {
      this.client.subscribe(topic);
    } else {
      console.log('not connected yet, put ' + topic + ' into queue.');
      this.waitingTopics.push(topic);
    }
  }
  unsubscribeTopic(topic: String) {
    this.client.unsubscribe(topic, {});
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
    // document['MQTT_CLIENT'].subscribe(father.topic);
    father.status = 'connected';
    for (let i = 0; i < father.waitingTopics.length; i++) {
      const topic = father.waitingTopics[i];
      console.log('subscribing waiting', topic);

      document['MQTT_CLIENT'].subscribe(topic);
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
  onMessageArrived(message: Object) {
    const father = document['MQTT_CLIENT']['father'];
    // console.log(
    //   'topic:' + message['topic'] + ' payload: ' + message['payloadString']
    // );
    const topic = message['topic'];
    const payLoadObj = JSON.parse(message['payloadString']);

    // need to check if there are any wildcard topic listeners?
    if (father.emitChangeSources[topic]) {
      father.emitChangeSources[topic].next(payLoadObj);
      return;
    }
    const keys = Object.keys(father.emitChangeSources);
    for (let i = 0; i < keys.length; i++) {
      const element = keys[i];
      // console.log('subscriber:', element);
      if (element === '#') {
        father.emitChangeSources[element].next(payLoadObj);
        return;
      }
      if (element.startsWith('+/')) {
        const remainingTopic = topic.replace(/^[^/]*\//, '=');
        const remainingElement = element.replace(/^[+]\//, '=');
        if (remainingTopic == remainingElement) {
          // console.log('match for +/ successful');
          father.emitChangeSources[element].next(payLoadObj);
          return;
        }
      }
    }
    console.error('no topic subscribers found for', topic);
  }
}
