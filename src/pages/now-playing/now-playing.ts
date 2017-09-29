import { Component, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy, ElementRef, Renderer } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, PopoverController, Content, ToastController } from 'ionic-angular';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { Subscription } from "rxjs/Subscription";
import { VideoService } from "../../app/services/video.service";
import { Storage } from '@ionic/storage';
import { USER_DATA_KEY } from "../../app/app.constants";
import { VideoDetails, VideoComment } from "../../app/models/video.models";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { Observable } from "rxjs/Observable";
import { DownloadService } from "../../app/services/download.service";
import { HomePopoverPage } from "../../app/popover";
import { ChannelService } from "../../app/services/channel.service";
import { ChannelDetails } from "../../app/models/channel.models";
import { PlaylistService } from "../../app/services/playlist.service";
import { LoginPage } from "../login/login";

@Component({
  selector: 'page-now-playing',
  templateUrl: 'now-playing.html'
})
export class NowPlayingPage {
  @ViewChild('videoPlayer') videoplayer;
  @ViewChild('content') content;

  private videoId: string;
  private videoDetails: VideoDetails;
  private playlistVideoIds: string[] = [];
  private playlistVideoDetails: VideoDetails[] = [];
  private relatedVideoDetails: VideoDetails[] = [];
  private videoComments: VideoComment[] = [];

  private safeVideoUrl: SafeResourceUrl;
  private userImageUrl: string;

  private numOfChannelFollowers = 0;
  private relatedVideosPage = 1;
  private playlistIndex = 0;
  private downloadProgress: number = 0;
  private downloadProgressSubscription: Subscription;

  private isLoading = false;
  private isLoggedIn = false;
  private isVideoDownloaded = false;
  private isVideoDownloading = false;
  private isVideoAddedToPlaylist = false;
  private isStarting = false;
  private isFollowing = false;
  private hasBeenLiked = false;

  private shouldPlayPlaylist = false;
  private isDisplayingPlaylist = false;

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
    private downloadService: DownloadService,
    private channelService: ChannelService,
    private playlistService: PlaylistService,
    private storage: Storage,
    private alertController: AlertController,
    private sanitizer: DomSanitizer,
    private ref: ChangeDetectorRef,
    private popoverCtrl: PopoverController,
    private toastCtrl: ToastController
  ) {
    this.shouldPlayPlaylist = navParams.get('playAll');
    this.videoId = navParams.get('id');
  }

  ionViewWillEnter() {
    // get orientation subscription so that this can be unsubscribed later when
    // the user leaves the page
    this.orientationSubscription = this.screenOrientation.onChange().subscribe(() => {
      let videoPlayerNE = this.videoplayer.nativeElement;
      this.isVideoFullscreen = !this.isOrientationPortrait(this.screenOrientation.type);
    });
    if (!this.shouldPlayPlaylist) {
      this.goToVideo(this.videoId);
    } else {
      this.getPlaylistAndPlayFirstVideo();
    }
  }

  ionViewWillLeave() {
    this.orientationSubscription.unsubscribe();
    this.downloadProgressSubscription.unsubscribe();
  }

  presentPopover(myEvent, vids) {
    let popover = this.popoverCtrl.create(HomePopoverPage, { videoDetails: vids });
    popover.present({ ev: myEvent });
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
    if (this.hasBeenLiked) {
      return;
    } else {
      // retrieve first the details of the user
      this.storage.get(USER_DATA_KEY).then(userData => {
        // user is not logged in if the userdata is null
        if (userData) {
          // request add like to video
          return this.videoService.addLike(this.videoId, userData.id);
        } else {
          throw new Error('not_logged_in');
        }
      }).then(isSuccessful => {
        // check if the video has been successfully liked
        this.hasBeenLiked = isSuccessful;
        if (isSuccessful)
          // refresh the number of likes
          return this.videoService.getLikes(this.videoId);
        else
          // something went wrong during request of add like
          throw new Error('not_liked_successfully');
      }).then(numOfLikes => {
        // update the number of likes
        this.videoDetails.likes = `${numOfLikes}`;
      }).catch(e => {
        if (e instanceof Error) {
          switch (e.message) {
            case 'not_logged_in':
              let toast = this.toastCtrl.create({
                duration: 1000,
                position: 'bottom',
                showCloseButton: true,
                closeButtonText: 'Login',
                dismissOnPageChange: true,
                message: 'Login to like this video.',
              });
              toast.onDidDismiss(() => {
                this.navCtrl.push(LoginPage);
              });
              toast.present();
              break;
            case 'multiple_entries':
            case 'never_gonna_happen':
            case 'not_liked_successfully':
            default:
              this.showErrorAlertOnVideoLike();
              break;
          }
        } else {
          this.showErrorAlertOnVideoLike();
        }
      });
    }
  }

  commentOnVideo() {
    // retrieve first the details of the user
    this.storage.get(USER_DATA_KEY).then(userData => {
      if (userData) {
        // request for add comment to video
        return this.videoService.addComment(this.videoId, userData.id, this.commentContent);
      } else {
        throw new Error('not_logged_in');
      }
    }).then(isSuccessful => {
      // check if the comment was successfully posted
      if (isSuccessful) {
        // refresh comment section and clear comment box
        this.commentContent = '';
        this.videoService.getComments(this.videoId).then(comments => {
          this.videoComments = comments;
        });
      } else {
        this.showErrorAlertOnVideoComment();
      }
    }).catch(e => {
      let unknownError = (e) => {
        console.error(JSON.stringify(e));
        this.showErrorAlertOnVideoComment();
      };

      if (e instanceof Error) {
        switch (e.message) {
          case 'not_logged_in':
            let toast = this.toastCtrl.create({
              duration: 1000,
              position: 'bottom',
              showCloseButton: true,
              closeButtonText: 'Login',
              dismissOnPageChange: true,
              message: 'Login to comment on this video.',
            });
            toast.onDidDismiss(() => {
              this.navCtrl.push(LoginPage);
            });
            toast.present();
            break;
          default:
            unknownError(e);
            break;
        }
      } else {
        unknownError(e);
      }
    });
  }

  addVideoToPlaylist() {
    if (this.isVideoAddedToPlaylist) {
      this.showAlertVideoAlreadyInPlaylist();
    } else {
      // retrieve first the details of the user
      this.storage.get(USER_DATA_KEY).then(userData => {
        // user is not logged in if the userdata is null
        if (userData) {
          return this.videoService.addToPlaylist(this.videoId, userData.id);
        } else {
          throw new Error('not_logged_in');
        }
      }).then(isSuccessful => {
        if (isSuccessful) {
          this.showAlertVideoAddedToPlaylist();
        } else {
          this.showAlertVideoNotAddedToPlaylist();
        }
      }).catch(e => {
        let unknownError = (e) => {
          console.error(JSON.stringify(e));
          this.showErrorAlertOnVideoPlaylist();
        };

        if (e instanceof Error) {
          switch (e.message) {
            case 'not_logged_in':
              let toast = this.toastCtrl.create({
                duration: 1000,
                position: 'bottom',
                showCloseButton: true,
                closeButtonText: 'Login',
                dismissOnPageChange: true,
                message: 'Login to add this video to your playlist.',
              });
              toast.onDidDismiss(() => {
                this.navCtrl.push(LoginPage);
              });
              toast.present();
              break;
            case 'already_in_playlist':
              this.showAlertVideoAlreadyInPlaylist();
              break;
            default:
              unknownError(e);
              break;
          }
        } else {
          unknownError(e);
        }
      });
    }
  }

  downloadVideo() {
    if (this.isStarting || this.isVideoDownloading) {
      return;
    } else if (this.isVideoDownloaded) {
      this.showAlertVideoHasAlreadyBeenDownloaded();
    } else {
      this.isStarting = true;
      this.storage.get(USER_DATA_KEY).then(userData => {
        if (userData) {
          return this.videoService.download(this.videoId, userData.id, userData.email);
        } else {
          throw new Error('not_logged_in');
        }
      }).then(observable => {
        this.observeInProgressDownload(this.videoId, observable);
      }, error => {
        throw error;
      }).catch(e => {
        let unknownError = (e) => {
          console.error(JSON.stringify(e));
          this.showErrorAlertOnVideoDownload();
        };

        if (e instanceof Error) {
          switch (e.message) {
            case 'not_logged_in':
              let toast = this.toastCtrl.create({
                duration: 1000,
                position: 'bottom',
                showCloseButton: true,
                closeButtonText: 'Login',
                dismissOnPageChange: true,
                message: 'Login to download this video.',
              });
              toast.onDidDismiss(() => {
                this.navCtrl.push(LoginPage);
              });
              toast.present();
              break;
            case 'already_downloaded':
              this.showAlertVideoHasAlreadyBeenDownloaded();
              break;
            default:
              unknownError(e);
              break;
          }
        } else {
          unknownError(e);
        }
      });
    }
  }

  goToVideo(id: string, playFromPlaylist: boolean = false) {
    if (!playFromPlaylist && this.shouldPlayPlaylist) {
      this.shouldPlayPlaylist = false;
      this.isDisplayingPlaylist = false;
      this.playlistIndex = 0;
      this.playlistVideoIds = [];
      this.playlistVideoDetails = [];
    }

    this.isLoading = true;
    this.videoId = id;
    // initialize screen orientation variable
    this.isVideoFullscreen = !this.isOrientationPortrait(this.screenOrientation.type);

    // get video information
    let detailsPromise = this.videoService.getDetails(this.videoId).then(details => {
      this.videoDetails = details;
      this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.videoDetails.mapped.playerUrl);

      this.channelService.getDetailsOf(this.videoDetails.channelId).then(channelDetails => {
        this.numOfChannelFollowers = parseInt(channelDetails.followers);
      });

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

          let obs = this.videoService.getInProgressDownload(this.videoId);
          if (obs) {
            this.observeInProgressDownload(this.videoId, obs);
          }
        }).catch(e => {
          console.log(e);
        });
        this.channelService.isFollowing(this.videoDetails.channelId, userData.id).then(isFollowing => {
          this.isFollowing = isFollowing;
        }).catch(e => {
          console.log(e);
        });

        let hasBeenLikedPromise = this.videoService.hasBeenLiked(this.videoId, userData.id).then(hasBeenLiked => {
          // FIXME: check if the video has been liked by the user
          // FIXME: requires a new API call
          this.hasBeenLiked = hasBeenLiked;
        }).catch(e => {
          console.log(e);
        });
      }
    });

    // load 5 initial related videos
    let relatedVideosPromise = this.videoService.getRelatedVideos(this.videoId).then(relatedVideos => {
      this.relatedVideoDetails = relatedVideos;
    });
    // load video's comments
    let commentsPromise = this.videoService.getComments(this.videoId).then(comments => {
      this.videoComments = comments;
    });

    Promise.all([detailsPromise, commentsPromise, relatedVideosPromise]).then(_ => {
      this.isLoading = false;
      if (this.content) {
        this.content.scrollToTop();
      }
    })
  }

  followChannel() {
    this.storage.get(USER_DATA_KEY).then(userdata => {
      if (userdata) {
        this.channelService.follow(this.videoDetails.channelId, userdata.id).then(isSuccessful => {
          if (!isSuccessful)
            return;

          this.channelService.isFollowing(this.videoDetails.channelId, userdata.id).then(isFollowing => {
            this.isFollowing = isFollowing;
          });
        });
      }
    });
  }

  unfollowChannel() {
    this.storage.get(USER_DATA_KEY).then(userdata => {
      if (userdata) {
        this.channelService.unfollow(this.videoDetails.channelId, userdata.id).then(isSuccessful => {
          if (!isSuccessful)
            return;

          this.channelService.isFollowing(this.videoDetails.channelId, userdata.id).then(isFollowing => {
            this.isFollowing = isFollowing;
          });
        });
      }
    });
  }

  viewPlaylist() {
    this.isDisplayingPlaylist = !this.isDisplayingPlaylist;
  }

  playNextVideo() {
    if (this.hasNextVideoInPlaylist())
      this.goToVideo(this.playlistVideoIds[++this.playlistIndex], true);
  }

  playPrevVideo() {
    if (this.hasPreviousVideoInPlaylist())
      this.goToVideo(this.playlistVideoIds[--this.playlistIndex], true);
  }

  playVideoInPlaylist(index: number) {
    if (this.playlistIndex === index)
      return;

    this.playlistIndex = index;
    this.goToVideo(this.playlistVideoIds[index], true);
  }

  private getPlaylistAndPlayFirstVideo() {
    this.storage.get(USER_DATA_KEY).then(userdata => {
      return this.playlistService.getPlaylistOf(userdata.id);
    }).then(playlistEntries => {
      return playlistEntries.map(pe => String(pe.bcid));
    }).then(videoDetails => {
      this.playlistVideoIds = videoDetails;
      return Promise.all(this.playlistVideoIds.map(id => {
        return this.videoService.getDetails(id);
      }));
    }).then(playlistVideos => {
      this.playlistVideoDetails = playlistVideos;
      this.goToVideo(this.playlistVideoIds[this.playlistIndex], true);
    });
  }

  private hasNextVideoInPlaylist() {
    return this.playlistIndex < (this.playlistVideoIds.length - 1);
  }

  private hasPreviousVideoInPlaylist() {
    return this.playlistIndex > 0;
  }

  private observeInProgressDownload(id: string, observable: Observable<number>) {
    this.isStarting = false;
    this.isVideoDownloading = true;
    this.downloadProgress = 0;

    this.downloadProgressSubscription = observable.subscribe(progress => {
      this.downloadProgress = progress;
      this.ref.detectChanges();
    }, e => {
      this.isVideoDownloading = false;

      this.downloadService.showDownloadErrorFinishAlertFor(this.videoDetails.bcid);
    }, () => {
      this.isVideoDownloading = false;
      this.isVideoDownloaded = true;

      this.downloadService.showDownloadFinishAlertFor(this.videoDetails.bcid);
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

  private showAlertVideoAddedToPlaylist() {
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
  }

  private showAlertVideoNotAddedToPlaylist() {
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

  private showAlertVideoAlreadyInPlaylist() {
    let alert = this.alertController.create({
      title: 'Oops!',
      message: 'This video has already been added to your playlist!',
      buttons: [{
        text: 'OK', handler: () => {
          alert.dismiss();
          return true;
        }
      }]
    });
    alert.present();
  }

  private showAlertVideoHasAlreadyBeenDownloaded() {
    let alert = this.alertController.create({
      title: 'Oops!',
      message: 'This video has already been downloaded!',
      buttons: [{
        text: 'OK', handler: () => {
          alert.dismiss();
          return true;
        }
      }]
    });
    alert.present();
  }

  private showErrorAlertOnVideoLike() {
    let alert = this.alertController.create({
      title: 'Oh no!',
      message: 'An error occurred while trying to add your like to the video. Please try again',
      buttons: [{
        text: 'Ok', handler: () => {
          alert.dismiss();
          return true;
        }
      }]
    });
    alert.present();
  }

  private showErrorAlertOnVideoDownload() {
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
    alert.present();
  }

  private showErrorAlertOnVideoPlaylist() {
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
    alert.present();
  }

  private showErrorAlertOnVideoComment() {
    let alert = this.alertController.create({
      title: 'Oh no!',
      message: 'Your comment was not successfully posted. Please try again',
      buttons: [{
        text: 'Ok', handler: () => {
          alert.dismiss();
          return true;
        }
      }]
    });
    alert.present();
  }
}
