import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, PopoverController } from 'ionic-angular';
import { PopoverPage } from "../../app/popover";
import { ChannelPrevPage } from "../channel-prev/channel-prev";
import { SearchPage } from "../search/search";

@Component({
  selector: 'page-channels',
  templateUrl: 'channels.html',
})
export class ChannelsPage {

  private descLabel:string = 'md-arrow-dropdown';
  private isDescriptionShown: boolean = false;
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
  searchThing(){
    this.navCtrl.push(SearchPage);
  }
  seeDesc(){
    this.isDescriptionShown = !this.isDescriptionShown;
    this.descLabel= this.isDescriptionShown ? 'md-arrow-dropup' : 'md-arrow-dropdown';
  }
}
