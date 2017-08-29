import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

@Component({
  selector: 'page-now-playing',
  templateUrl: 'now-playing.html',
})
export class NowPlayingPage {

  private vidDescButtonIcon: string = 'md-arrow-dropdown';
  private isDescriptionShown: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  toggleDescriptionVisibility() {
    this.isDescriptionShown = !this.isDescriptionShown;
    this.vidDescButtonIcon = this.isDescriptionShown ? 'md-arrow-dropup' : 'md-arrow-dropdown';
  }
}
