import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, PopoverController } from 'ionic-angular';
import { PopoverPage } from "../../app/popover";

@Component({
  selector: 'page-channel-prev',
  templateUrl: 'channel-prev.html',
})
export class ChannelPrevPage {

  private descLabel:string = 'md-arrow-dropdown';
  private isDescriptionShown: boolean = false;
  constructor(public navCtrl: NavController, public navParams: NavParams, public popoverCtrl: PopoverController) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ChannelPrevPage');
  }
  presentPopover(myEvent) {
    let popover = this.popoverCtrl.create(PopoverPage);
    popover.present({
      ev: myEvent
    });
  }
  seeDesc(){
    this.isDescriptionShown = !this.isDescriptionShown;
    this.descLabel= this.isDescriptionShown ? 'md-arrow-dropup' : 'md-arrow-dropdown';
  }

}
