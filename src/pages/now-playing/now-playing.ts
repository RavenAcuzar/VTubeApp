import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { Subscription } from "rxjs/Subscription";

@Component({
  selector: 'page-now-playing',
  templateUrl: 'now-playing.html',
})
export class NowPlayingPage {
  @ViewChild('videoPlayer') videoplayer;
  
  private vidDescButtonIcon: string = 'md-arrow-dropdown';
  private isDescriptionShown: boolean = false;
  private isVideoFullscreen: boolean = false;
  private orientationSubscription: Subscription;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private screenOrientation: ScreenOrientation
  ) {
  }

  ionViewWillEnter() {
    // initialize screen orientation variable
    this.isVideoFullscreen = !this.isOrientationPortrait(this.screenOrientation.type);

    // get orientation subscription so that this can be unsubscribed later when
    // the user leaves the page
    this.orientationSubscription = this.screenOrientation.onChange().subscribe(() => {
      let videoPlayerNE = this.videoplayer.nativeElement;

      console.log('Orientation changed!')
      console.log(this.screenOrientation.type);

      this.isVideoFullscreen = !this.isOrientationPortrait(this.screenOrientation.type);
    })
  }

  ionViewWillLeave() {
    this.orientationSubscription.unsubscribe();
  }

  toggleDescriptionVisibility() {
    this.isDescriptionShown = !this.isDescriptionShown;
    this.vidDescButtonIcon = this.isDescriptionShown ? 'md-arrow-dropup' : 'md-arrow-dropdown';
  }

  private isOrientationPortrait(type: string): boolean {
    switch (type) {
      case 'portrait':
      case 'portrait-primary':
      case 'portrait-secondary':
        return true;
      case 'landscape':
      case 'landscape-primary':
      case 'landscape-secondary':
        return false;
    }
  }
}
