import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { Subscription } from "rxjs/Subscription";
import { VideoService } from "../../app/services/video.service";

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
    private screenOrientation: ScreenOrientation,
    private videoService: VideoService
  ) { }

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

  loadRelatedVideo() {
    // TODO: REPLACE THE VIDEO IN THE CURRENT PAGE WITH THE
    // SELECTED RELATED VIDEO
  }

  likeVideo() {
    // TODO: call `addLike` in the video service
  }

  commentOnVideo() {
    // TODO: call `addComment` in the video service
  }

  addVideoToPlaylist() {
    this.videoService.addToPlaylist('<id>', '<userid>').then(isSuccessful => {
      // TODO: do something when action is successful
    })
  }

  downloadVideo() {
    this.videoService.download('<id>', '<userid>', '<email>').then(observable => {
      observable.subscribe(progress => {
        // progress
      }, e => {
        // error
      }, () => {
        // complete
      })
    })
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
