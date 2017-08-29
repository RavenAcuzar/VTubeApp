import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, PopoverController } from 'ionic-angular';
import { PopoverPage } from "../../app/popover";
import { ChannelPrevPage } from "../channel-prev/channel-prev";

@Component({
  selector: 'page-channels',
  templateUrl: 'channels.html',
})
export class ChannelsPage {

  channelType: string="myChannel";
  constructor(public navCtrl: NavController, public navParams: NavParams, protected popoverCtrl: PopoverController) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ChannelsPage');
  }

  presentPopover(myEvent) {
    let popover = this.popoverCtrl.create(PopoverPage);
    popover.present({
      ev: myEvent
    });
  }
  goToChannelView(){
    this.navCtrl.push(ChannelPrevPage);
  }
}
