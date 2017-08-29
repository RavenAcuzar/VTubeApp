import { Component } from '@angular/core';
import { NavController, PopoverController } from 'ionic-angular';
import { PopoverPage } from "../../app/popover";
import { NowPlayingPage } from "../now-playing/now-playing";
import { SearchPage } from "../search/search";


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  vidType: string="freeVid";
  constructor(public navCtrl: NavController,protected popoverCtrl: PopoverController) {

  }
  presentPopover(myEvent) {
    let popover = this.popoverCtrl.create(PopoverPage);
    popover.present({
      ev: myEvent
    });
  }

  playVideo(id: string) {
    this.navCtrl.push(NowPlayingPage);
  }
  searchThing(){
    this.navCtrl.push(SearchPage);
  }
}


