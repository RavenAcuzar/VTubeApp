import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { Subscription } from "rxjs/Subscription";
import { VideoService } from "../../app/services/video.service";
import { Storage } from '@ionic/storage';
import { USER_DATA_KEY } from "../../app/app.constants";
import { VideoDetails, VideoComment } from "../../app/models/video.models";

@Component({
  selector: 'page-now-playing',
  templateUrl: 'now-playing.html',
})
export class NowPlayingPage {
  @ViewChild('videoPlayer') videoplayer;
  
  private videoId: string;
  private videoDetails: VideoDetails;
  private relatedVideoDetails: VideoDetails[];
  private videoComments: VideoComment[];
  
  private isVideoDownloaded = false;
  private isVideoAddedToPlaylist = false;

  private vidDescButtonIcon: string = 'md-arrow-dropdown';
  private isDescriptionShown: boolean = false;
  private isVideoFullscreen: boolean = false;
  private orientationSubscription: Subscription;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private screenOrientation: ScreenOrientation,
    private videoService: VideoService,
    private storage: Storage,
    private alertController: AlertController
  ) { 
    this.videoId = navParams.get('id');
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
    });

    // get video information
    this.videoService.getDetails(this.videoId).subscribe(details => {
      this.videoDetails = details;
    });
    this.videoService.getRelatedVideos(this.videoId).subscribe(relatedVideos => {
      this.relatedVideoDetails = relatedVideos;
    });
    this.videoService.getComments(this.videoId).subscribe(comments => {
      this.videoComments = comments;
    });

    // get user dependent details
    this.storage.get(USER_DATA_KEY).then(userData => {
      if (userData) {
        // check if the video has been added to the playlist by the user
        this.videoService.isAddedToPlaylist(this.videoId, userData.id).then(isAdded => {
          this.isVideoAddedToPlaylist = isAdded;
        })
        // check if the video has been downloaded by the user
        this.videoService.isDownloaded(this.videoId, userData.id).then(isDownloaded => {
          this.isVideoDownloaded = isDownloaded;
        });
        // TODO: check if the video has been liked by the user
        // DEPENDS ON: requires a new API call
      }
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
    this.storage.get(USER_DATA_KEY).then(userData => {
      if (userData) {
        return this.videoService.addToPlaylist(this.videoId, userData.id);
      } else {
        // TODO 4 RICO: DISPLAY A TOAST TO TELL USER THAT
        // USER NEEDS TO SIGN IN TO BE ABLE TO ADD A LIKE 
        console.log('The user needs to sign in.');
      }
    }).then(isSuccessful => {
      if (isSuccessful) {
        let alert = this.alertController.create({
          title: 'Added to Playlist',
          message: 'The video has been successfully added to your playlist!',
          buttons: [{ text: 'OK', handler: () => {
              alert.dismiss();
              return true;
            }
          }]
        });
        alert.present();
      } else {
        let alert = this.alertController.create({
          title: 'Failed to Add to Playlist',
          message: 'The video was not successfully added to your playlist.',
          buttons: [{ text: 'OK', handler: () => {
              alert.dismiss();
              return true;
            }
          }]
        });
        alert.present();
      }
    })
  }

  downloadVideo() {
    this.storage.get(USER_DATA_KEY).then(userData => {
      if (userData) {
        return this.videoService.download(this.videoId, userData.id, userData.email);
      } else {
        // TODO 4 RICO: DISPLAY A TOAST TO TELL USER THAT
        // USER NEEDS TO SIGN IN TO BE ABLE TO ADD A LIKE 
        console.log('The user needs to sign in.');
      }
    }).then(observable => {
      observable.subscribe(progress => {
        console.log(`Video download progress: ${progress}`);
      }, e => {
        console.log(`Video download error: ${JSON.stringify(e)}`);
      }, () => {
        console.log(`Video download complete`);

        let alert = this.alertController.create({
          title: 'Download Video',
          message: 'The video has been successfully downloaded!'
        });
        alert.present();
      })
    }).catch(e => {
      console.error(JSON.stringify(e));
      let alert = this.alertController.create({
        title: 'Oops!',
        message: 'An error occurred while trying to download the video. Please try again.',
        buttons: [{ text: 'OK', handler: () => {
            alert.dismiss();
            return true;
          }
        }]
      });
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
