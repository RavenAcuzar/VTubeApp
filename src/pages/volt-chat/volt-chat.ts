import { Component, Renderer, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { VoltChatService, VoltChatEntry } from "../../app/services/volt-chat.service";
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'page-volt-chat',
  templateUrl: 'volt-chat.html'
})
export class VoltChatPage {
  @ViewChild('content') content:any;

  private message: string = '';
  private subscription: Subscription;
  private conversation: VoltChatEntry[] = [];
  private shouldScrollToBottom =  false;

  constructor(
    private chatService: VoltChatService,
    private rendered: Renderer,
    private navCtrl: NavController,
    private navParams: NavParams) {
  }

  ionViewDidEnter() {
    this.chatService.getPreviousMessages().then(entries => {
      this.conversation = entries.map(en=>{
        en.selected = true;
        return en
      });
      this.shouldScrollToBottom = true;
      return this.chatService.getObservableChat();
    }).then(o => {
      this.subscription = o.subscribe(entry => {
        this.shouldScrollToBottom = true;
        this.conversation.push(entry);
      });
    });
  }

  ionViewDidLeave() {
    this.subscription.unsubscribe();
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.shouldScrollToBottom = false;
      this.content.scrollToBottom(300);
    }
  }

  sendMessage() {
    if (this.message === '') {
      return;
    } else {
      this.chatService.sendMessage(this.message).then(() => {
        this.message = '';
        this.content.scrollToBottom(300);
      });
    }
  }
}
