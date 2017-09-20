import { Component, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy, ElementRef, Renderer } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, PopoverController, Content } from 'ionic-angular';
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
    private popoverCtrl: PopoverController
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
      // TODO: retrieve the first video in playlist
      this.getPlaylistAndPlayFirstVideo();
    }
  }

  ionViewWillLeave() {
    this.orientationSubscription.unsubscribe();
    this.downloadProgressSubscription.unsubscribe();
  }

  presentPopover(myEvent, vids) {
    let popover = this.popoverCtrl.create(HomePopoverPage, {
      videoDetails: vids
    });
    popover.present({
      ev: myEvent
    });
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

        // TODO: check if the video has been liked by the user
        // FIXME: requires a new API call
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
}
