import { Component, Renderer, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { VoltChatService, VoltChatEntry } from "../../app/services/volt-chat.service";
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'page-volt-chat',
  templateUrl: 'volt-chat.html'
})
export class VoltChatPage {
  @ViewChild('content') content;

  private message: string = '';
  private subscription: Subscription;
  private conversation: VoltChatEntry[] = [];

  constructor(
    private chatService: VoltChatService,
    private rendered: Renderer,
    private navCtrl: NavController,
    private navParams: NavParams) {
  }

  ionViewDidEnter() {
    this.chatService.getPreviousMessages().then(entries => {
      this.conversation = entries;
      return this.chatService.getObservableChat();
    }).then(o => {
      this.subscription = o.subscribe(entry => {
        this.conversation.push(entry);
        this.content.scrollToBottom(300);
      });
    });
  }

  ionViewDidLeave() {
    this.subscription.unsubscribe();
  }

  sendMessage() {
    if (this.message === '') {
      return;
    } else {
      this.chatService.sendMessage(this.message).then(() => {
        this.message = '';
      });
    }
  }
}
