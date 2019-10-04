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

  private emitChangeSources = {};
  public observableTopics$ = {};
  private waitingRequests = [];

  private client;
  private clientID = 'clientID_' + String(Math.random() * 100);
  public status = 'init'; // | connecting | connected | failed | lost
  public disconnects = 0;

  private sampleRequestObject = {
    topic: '+/sensors/+/temperature',
    tagFilters: { key1: 'value1', key2: 'value2' },
    valueFilters: ['air_degC', 'probe_degC']
  };
  private activeRequesters = [];

  constructor(private globalSettings: GlobalSettingsService) {
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
  private init() {
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
    this.client.onConnectionLost = (obj: Object) => this.onConnectionLost(obj);
    this.client.onMessageArrived = (obj: Object) => this.onMessageArrived(obj);
    console.log('MQTT client under construction', this.client);
    this.connect();
  }

  public request(requestObject: Object) {
    const topic =  requestObject['topic'];
    if (! topic) {
      console.error('mqtt.request: no topic ');
      return -1;
    }
    this.emitChangeSources[topic] = new Subject<any>();
    this.observableTopics$[topic] = this.emitChangeSources[
      topic
    ].asObservable();

    if (this.status === 'connected') {
      this.client.subscribe(topic);
      this.activeRequesters.push(requestObject);
    } else {
      console.log('not connected yet, put ' + requestObject + ' into queue.');
      this.waitingRequests.push(requestObject);
    }
  }
  public unsubscribeTopic(topic: String) {
    this.client.unsubscribe(topic, {});
  }

  private connect() {
    this.client.connect({
      onSuccess: () => this.onConnect(),
      onFailure: (obj: Object) => this.onFailure(obj)
    });
    this.status = 'connecting';
  }
  private onConnect() {
    console.log('onConnect');
    this.status = 'connected';
    for (let i = 0; i < this.waitingRequests.length; i++) {
      const request = this.waitingRequests[i];
      console.log('subscribing waiting', request);
      this.client.subscribe(request['topic']);
      this.activeRequesters.push(request);
    }
  }
  private onFailure(message) {
    console.error('MQTT failure on connect');
    console.error(message);
    this.status = 'failed';
  }
  private onConnectionLost(responseObject) {
    console.error('onConnectionLost object: ', responseObject);
    if (responseObject.errorCode !== 0) {
      console.error('onConnectionLost:', responseObject.errorMessage);
    }
    this.status = 'lost';
    this.disconnects += 1;
    this.connect();
  }
  private onMessageArrived(message: Object) {
    // console.log(
    //   'topic:' + message['topic'] + ' payload: ' + message['payloadString']
    // );
    const topic = message['topic'];
    const payLoadObj = JSON.parse(message['payloadString']);

    const keys = Object.keys(this.emitChangeSources);
    let found = false;
    for (let i = 0; i < keys.length; i++) {
      const element = keys[i];
      // console.log('subscriber:', element);

      if (this.compareTopics(element, topic)) {
        this.emitChangeSources[element].next(payLoadObj);
        found = true;
      }
    }
    if (!found) {
      console.error('no topic subscribers found for', topic);
    }
  }
  public compareTopics(subscribedTopic: string, receivedTopic: string) {
    console.log(subscribedTopic, 'vs', receivedTopic);

    if (subscribedTopic === '#') {
      return true;
    }
    const subscribedArray = subscribedTopic.split('/');
    const receivedArray = receivedTopic.split('/');
    if (receivedArray.length > subscribedArray.length) {
      console.error('mqtt.compareTopics: unknown situation');
    }
    for (let i = 0; i < subscribedArray.length; i++) {
      const subscribedPart = subscribedArray[i];
      const receivedPart = receivedArray[i];
      if (!receivedPart) {
        console.log('mqtt.compareTopics: received part shorter than subscribe');
        return false;
      }
      if (subscribedPart == '+' || subscribedPart === receivedPart) {
        continue;
      }

      // not matched
      return false;
    }

    // every part matched
    return true;
  }
}
