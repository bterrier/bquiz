import { Injectable, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

interface Message {
  type: string;
  answer: string;
}

@Injectable({
  providedIn: 'root'
})
export class LiteComService {

  event: EventEmitter<string> = new EventEmitter(true);
  private socket: WebSocket;
  private _id: string = '';
  get id(): string {
    return this._id;
  }

  set id(id: string) {
    this._id = id;
    if (this.socket.readyState == WebSocket.OPEN) {
      this.join();
    }
  }

  constructor() {
    this.tryConnecting();
  }

  private clear() {
    this.event.emit('');
  }

  private setAnswer(answer: string) {
    this.event.emit(answer);
  }

  private tryConnecting() {
    this.socket = new WebSocket("wss://<url>:8081");
    this.socket.onerror = (ev: Event) => this.onError(ev);
    this.socket.onopen = () => this.onConnected();
    this.socket.onmessage = (ev: MessageEvent) => this.onMessage(ev);
    this.socket.onclose = () => this.onClose();
  }

  private onConnected() {
    if (this._id.length !== 0) {
      this.join();
    }
  }

  private onError(ev: Event) {
    console.log("error:" + ev);
    console.log(ev);
  }

  private onMessage(ev: MessageEvent) {
    const obj = <Message>JSON.parse(ev.data);
    if (obj.type === 'clear') {
      this.clear();
    } else if (obj.type === 'nuggets') {
      this.setAnswer(obj.answer);
    } else if (obj.type === 'sp') {
      this.setAnswer(obj.answer);
    }
  }

  private onClose() {
    setTimeout(() => this.tryConnecting(), 2000);
  }

  selectAnswer(answer: string) {
    const data = JSON.stringify({
      type: "nuggets",
      id: this.id,
      answer: answer
    });
    this.socket.send(data);
  }

  selectSPAnswer(answer: string) {
    const data = JSON.stringify({
      type: "sp",
      id: this.id,
      answer: answer
    });
    this.socket.send(data);
  }

  private join() {
    const data = JSON.stringify({
      type: "join",
      id: this.id
    });
    this.socket.send(data);
  }
}
