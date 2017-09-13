import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { Subscription } from "rxjs/Subscription";
import { VideoService } from "../../app/services/video.service";
import { Storage } from '@ionic/storage';
import { USER_DATA_KEY } from "../../app/app.constants";
import { VideoDetails, VideoComment } from "../../app/models/video.models";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

@Component({
  selector: 'page-now-playing',
  templateUrl: 'now-playing.html',
})
export class NowPlayingPage {
  @ViewChild('videoPlayer') videoplayer;

  private videoId: string;
  private videoDetails: VideoDetails;
  private relatedVideoDetails: VideoDetails[] = [];
  private videoComments: VideoComment[] = [];

  private safeVideoUrl: SafeResourceUrl;

  private relatedVideosPage = 1;

  private isLoggedIn = false;
  private isVideoDownloaded = false;
  private isVideoAddedToPlaylist = false;
  private isFollowing = false;

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
    private alertController: AlertController,
    private sanitizer: DomSanitizer
  ) {
    this.videoId = navParams.get('id');
  }

  ionViewWillEnter() {
    // get orientation subscription so that this can be unsubscribed later when
    // the user leaves the page
    this.orientationSubscription = this.screenOrientation.onChange().subscribe(() => {
      let videoPlayerNE = this.videoplayer.nativeElement;
      this.isVideoFullscreen = !this.isOrientationPortrait(this.screenOrientation.type);
    });
    this.goToVideo(this.videoId);
  }

  ionViewWillLeave() {
    this.orientationSubscription.unsubscribe();
  }

  toggleDescriptionVisibility() {
    this.isDescriptionShown = !this.isDescriptionShown;
    this.vidDescButtonIcon = this.isDescriptionShown ? 'md-arrow-dropup' : 'md-arrow-dropdown';
  }

  loadRelatedVideo() {
    this.videoService.getRelatedVideos(this.videoId, 5, ++this.relatedVideosPage).then(relatedVideos => {
      this.relatedVideoDetails = this.relatedVideoDetails.concat(relatedVideos);
    });
  }

  likeVideo() {
    this.storage.get(USER_DATA_KEY).then(userData => {
      this.videoService.addLike(this.videoId, userData.id).subscribe(_ => {
        // do something when the video has been liked by the user
        // TODO: UPDATE LIKED BUTTON TO RED COLOR
      });
    });
  }

  commentOnVideo() {
    this.storage.get(USER_DATA_KEY).then(userData => {
      // TODO: create add comment service function
    });
  }

  addVideoToPlaylist() {
    this.storage.get(USER_DATA_KEY).then(userData => {
      if (userData) {
        return this.videoService.addToPlaylist(this.videoId, userData.id);
      } else {
        // TODO: 4 RICO, DISPLAY A TOAST TO TELL USER THAT
        // USER NEEDS TO SIGN IN TO BE ABLE TO ADD A LIKE 
        console.log('The user needs to sign in.');
      }
    }).then(isSuccessful => {
      if (isSuccessful) {
        let alert = this.alertController.create({
          title: 'Added to Playlist',
          message: 'The video has been successfully added to your playlist!',
          buttons: [{
            text: 'OK', handler: () => {
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
          buttons: [{
            text: 'OK', handler: () => {
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
        // TODO: 4 RICO, DISPLAY A TOAST TO TELL USER THAT
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
        buttons: [{
          text: 'OK', handler: () => {
            alert.dismiss();
            return true;
          }
        }]
      });
    })
  }

  goToVideo(id: string) {
    this.videoId = id;
    // initialize screen orientation variable
    this.isVideoFullscreen = !this.isOrientationPortrait(this.screenOrientation.type);

    // get video information
    this.videoService.getDetails(this.videoId).then(details => {
      this.videoDetails = details;
      this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.videoDetails.mapped.playerUrl);

      return this.storage.get(USER_DATA_KEY);
    }).then(userData => {
      this.isLoggedIn = userData !== null;
      if (this.isLoggedIn) {
        // check if the video has been added to the playlist by the user
        this.videoService.isAddedToPlaylist(this.videoId, userData.id).then(isAdded => {
          this.isVideoAddedToPlaylist = isAdded;
        });
        // check if the video has been downloaded by the user
        this.videoService.isDownloaded(this.videoId, userData.id).then(isDownloaded => {
          this.isVideoDownloaded = isDownloaded;
        });
        this.videoService.isFollowingChannel(userData.id, this.videoDetails.channelId).then(isFollowing => {
          this.isFollowing = isFollowing;
        });

        // TODO: check if the video has been liked by the user
        // FIXME: requires a new API call
      }
    });

    // load 5 initial related videos
    this.videoService.getRelatedVideos(this.videoId).then(relatedVideos => {
      this.relatedVideoDetails = relatedVideos;
    });
    // load video's comments
    this.videoService.getComments(this.videoId).then(comments => {
      this.videoComments = comments;
    });
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
