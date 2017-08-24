import { Component } from '@angular/core';
import { NavController, PopoverController } from 'ionic-angular';
import { PopoverPage } from "../../app/popover";


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
}


