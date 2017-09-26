import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { VoltChatService } from "../../app/services/volt-chat.service";

@Component({
  selector: 'page-volt-chat',
  templateUrl: 'volt-chat.html',
})
export class VoltChatPage {

  private conversation: {
    message: string,
    sender: string,
    senderImageUrl: string,
    dateSent: number,
    dateSentStr: string
  }[] = [];
  private message: string = '';

  constructor(
    private chatService: VoltChatService,
    public navCtrl: NavController,
    public navParams: NavParams) {
  }

  sendMessage() {
    if (this.message === '') {
      return;
    }

    this.chatService.sendMessage(this.message, (id, username) => {
      let date = Date.now();
      let dateStr = new Date(date).toLocaleTimeString();

      this.conversation.push({
        sender: username,
        senderImageUrl: `http://the-v.net/Widgets_Site/avatar.ashx?id=${id}`,
        message: this.message,
        dateSent: date,
        dateSentStr: dateStr
      });
    }).then(m => {
      let date = Date.now();
      let dateStr = new Date(date).toLocaleTimeString();

      this.conversation.push({
        sender: 'Volt',
        senderImageUrl: 'assets/img/volt-login.png',
        message: m,
        dateSent: date,
        dateSentStr: dateStr
      });

      this.message = '';
    }).catch(e => {

    });
  }
}
