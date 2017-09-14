import { Component, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { Subscription } from "rxjs/Subscription";
import { VideoService } from "../../app/services/video.service";
import { Storage } from '@ionic/storage';
import { USER_DATA_KEY } from "../../app/app.constants";
import { VideoDetails, VideoComment } from "../../app/models/video.models";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { Observable } from "rxjs/Observable";

@Component({
  selector: 'page-now-playing',
  templateUrl: 'now-playing.html'
})
export class NowPlayingPage {
  @ViewChild('videoPlayer') videoplayer;

  private videoId: string;
  private videoDetails: VideoDetails;
  private relatedVideoDetails: VideoDetails[] = [];
  private videoComments: VideoComment[] = [];

  private safeVideoUrl: SafeResourceUrl;
  private userImageUrl: string;

  private relatedVideosPage = 1;

  private isLoggedIn = false;
  private isVideoDownloaded = false;
  private isVideoDownloading = false;
  private isVideoAddedToPlaylist = false;
  private isStarting = false;
  private isFollowing = false;

  private downloadProgress: number = 0;

  private commentContent: string = '';

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
    private sanitizer: DomSanitizer,
    private ref: ChangeDetectorRef
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
      this.videoService.addComment(this.videoId, userData.id, this.commentContent).then(isSuccessful => {
        if (isSuccessful) {
          this.commentContent = '';

          this.videoService.getComments(this.videoId).then(comments => {
            this.videoComments = comments;
          });
        } else {
          let alert = this.alertController.create({
            title: 'Oh no!',
            message: 'Your comment was not successfully posted.',
            buttons: [{
              text: 'Ok', handler: () => {
                alert.dismiss();
                return true;
              }
            }]
          });
          alert.present();
        }
      });
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
    }).catch(e => {
      let unknownError = (e) => {
        console.error(JSON.stringify(e));
        let alert = this.alertController.create({
          title: 'Oops!',
          message: 'An error occurred while trying to add the video to your playlist. Please try again.',
          buttons: [{
            text: 'OK', handler: () => {
              alert.dismiss();
              return true;
            }
          }]
        });
      }

      if (e instanceof Error) {
        switch (e.message) {
          case 'not_logged_in':
            // TODO: 4 RICO, DISPLAY A TOAST TO TELL USER THAT
            // USER NEEDS TO SIGN IN TO BE ABLE TO ADD A LIKE 
            console.log('The user needs to sign in.');
            break;
          case 'already_downloaded':
            console.log('Video has already been downloaded by the user.');
            break;
          default:
            unknownError(e);
            break;
        }
      } else {
        unknownError(e);
      }
    })
  }

  downloadVideo() {
    if (this.isVideoDownloaded) {
      return;
    }

    this.isStarting = true;
    this.isVideoDownloading = true;

    this.storage.get(USER_DATA_KEY).then(userData => {
      if (userData) {
        return this.videoService.download(this.videoId, userData.id, userData.email);
      } else {
        throw new Error('not_logged_in');
      }
    }).then(observable => {
      this.isStarting = false;
      this.downloadProgress = 0;

      observable.subscribe(progress => {
        this.downloadProgress = progress;
        this.ref.detectChanges();
      }, e => {
        this.isVideoDownloading = false;
      }, () => {
        this.isVideoDownloading = false;
        this.isVideoDownloaded = true;

        let alert = this.alertController.create({
          title: 'Download Video',
          message: 'The video has been successfully downloaded!',
          buttons: [{
            text: 'OK', handler: () => {
              alert.dismiss();
              return true;
            }
          }]
        });
        alert.present();
      })
    }, error => {
      throw error;
    }).catch(e => {
      let unknownError = (e) => {
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
      }

      if (e instanceof Error) {
        switch (e.message) {
          case 'not_logged_in':
            // TODO: 4 RICO, DISPLAY A TOAST TO TELL USER THAT
            // USER NEEDS TO SIGN IN TO BE ABLE TO ADD A LIKE 
            console.log('The user needs to sign in.');
            break;
          case 'already_in_playlist':
            console.log('Video has already been added to the playlist by the user.');
            break;
          default:
            unknownError(e);
            break;
        }
      } else {
        unknownError(e);
      }
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
        this.userImageUrl = `http://the-v.net/Widgets_Site/avatar.ashx?id=${userData.id}`;

        // check if the video has been added to the playlist by the user
        this.videoService.isAddedToPlaylist(this.videoId, userData.id).then(isAdded => {
          this.isVideoAddedToPlaylist = isAdded;
        }).catch(e => {
          console.log(e);
        });
        // check if the video has been downloaded by the user
        this.videoService.isDownloaded(this.videoId, userData.id).then(isDownloaded => {
          this.isVideoDownloaded = isDownloaded;
        }).catch(e => {
          console.log(e);
        });
        this.videoService.isFollowingChannel(userData.id, this.videoDetails.channelId).then(isFollowing => {
          this.isFollowing = isFollowing;
        }).catch(e => {
          console.log(e);
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
