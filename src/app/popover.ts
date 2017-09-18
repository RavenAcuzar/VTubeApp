import { ViewController, NavController, NavParams, AlertController } from "ionic-angular";
import { Component, ChangeDetectorRef } from "@angular/core";
import { Storage } from "@ionic/storage";
import { VideoDetails } from "./models/video.models";
import { VideoService } from "./services/video.service";
import { USER_DATA_KEY } from "./app.constants";
import { FallbackPage } from "../pages/fallback/fallback";
import { PlaylistService } from "./services/playlist.service";
import { DownloadService } from "./services/download.service";
import { Observable } from "rxjs/Observable";

@Component({
  template: `
    <ion-list class="playlist-popover-page">
      <button ion-item (click)="addToPlaylist()">Add to Playlist</button>
      <button ion-item (click)="download()" *ngIf = "!isVideoDownloading && !isVideoDownloaded">Download</button>
      <button ion-item  *ngIf = "isVideoDownloading && !isVideoDownloaded">Downloading {{downloadProgress}}%</button>
      <button ion-item  *ngIf = "isVideoDownloaded ">Downloaded</button>
    </ion-list>
  `
})
export class HomePopoverPage {

  isVideoDownloading = false;
  private isVideoDownloaded = false;
  downloadProgress: number = 0;
  private videoDetails: VideoDetails;

  constructor(
    private navCtrl: NavController,
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private storage: Storage,
    private videoService: VideoService,
    private downloadService: DownloadService,
    private ref: ChangeDetectorRef,
    private alertController: AlertController
  ) {
    this.videoDetails = <VideoDetails>this.navParams.data.videoDetails;
  }
  ionViewDidLoad() {
    document.getElementsByTagName("ion-app").item(0).classList.add("disable-scroll");

    this.storage.get(USER_DATA_KEY).then(userData => {
        this.videoService.isDownloaded(this.videoDetails.bcid, userData.id).then(isDownloaded => {
          this.isVideoDownloaded = isDownloaded;

          let obs = this.videoService.getInProgressDownload(this.videoDetails.bcid);
          if (obs) {
            this.isVideoDownloading = true;
            this.observeInProgressDownload(this.videoDetails.bcid, obs);
          }
        }).catch(e => {
          console.log(e);
        });
      })
  }


  ionViewWillLeave() {
    if (document.getElementsByTagName("ion-app").item(0).classList.contains("disable-scroll"))
      document.getElementsByTagName("ion-app").item(0).classList.remove("disable-scroll");
  }
  addToPlaylist() {
    this.viewCtrl.dismiss();
    this.storage.get(USER_DATA_KEY).then(userData => {
      if (userData) {
        return this.videoService.addToPlaylist(this.videoDetails.bcid, userData.id);
      } else {
        this.navCtrl.push(FallbackPage);
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
            this.navCtrl.push(FallbackPage);
            break;
          case 'already_in_playlist':
            console.log('Video has already been added to the playlist by the user.');
            let alert = this.alertController.create({
              title: 'Oops!',
              message: 'You already added this video to your playlist.',
              buttons: [{
                text: 'OK', handler: () => {
                  alert.dismiss();
                  return true;
                }
              }]
            });
            alert.present();
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

  download() {
    this.viewCtrl.dismiss();
    this.storage.get(USER_DATA_KEY).then(userData => {
      if (userData) {
        return this.videoService.download(this.videoDetails.bcid, userData.id, userData.email);
      } else {
        throw new Error('not_logged_in');
      }
    }).then(observable => {
      this.observeInProgressDownload(this.videoDetails.bcid, observable);
      observable.subscribe(progress => { }, e => {
        this.downloadService.showDownloadErrorFinishAlertFor(this.videoDetails.bcid);
      }, () => {
        this.downloadService.showDownloadFinishAlertFor(this.videoDetails.bcid);
      })
    }, error => {
      throw error;
    }).catch(e => {
      if (e instanceof Error) {
        switch (e.message) {
          case 'not_logged_in':
            this.navCtrl.push(FallbackPage);
            return;
          case 'already_downloaded':
            let alert = this.alertController.create({
              title: 'Oops!',
              message: 'You already downloaded this video.',
              buttons: [{
                text: 'OK', handler: () => {
                  alert.dismiss();
                  return true;
                }
              }]
            });
            alert.present();
            return;
        }
      }
      this.downloadService.showDownloadErrorFinishAlertFor(this.videoDetails.bcid);
    })
  }
  private observeInProgressDownload(id: string, observable: Observable<number>) {
    this.downloadProgress = 0;
    this.isVideoDownloading = true;

    observable.subscribe(progress => {
      this.downloadProgress = progress;
      this.ref.detectChanges();
    }, e => {
      console.log(e);
      this.isVideoDownloading = false;
      this.downloadService.showDownloadErrorFinishAlertFor(this.videoDetails.bcid);
    }, () => {
      this.isVideoDownloading = false;
      this.downloadService.showDownloadFinishAlertFor(this.videoDetails.bcid);
    });
  }
}

@Component({
  template: `
    <ion-list class="playlist-popover-page">
      <button ion-item (click)="removeFromPlaylist()">Remove from playlist</button>
      <button ion-item (click)="download()">Download</button>
    </ion-list>
  `
})
export class PlaylistPopoverPage {
  
  isVideoDownloading = false;
  private isVideoDownloaded = false;
  downloadProgress: number = 0;
  private refreshPlaylistCallback: () => void;

  private videoDetails: VideoDetails;

  constructor(
    private navCtrl: NavController,
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private storage: Storage,
    private videoService: VideoService,
    private playlistService: PlaylistService,
    private ref: ChangeDetectorRef,
    private downloadService: DownloadService,
    private alertController: AlertController
  ) {
    this.videoDetails = <VideoDetails>this.navParams.data.videoDetails;
    this.refreshPlaylistCallback = this.navParams.data.refreshPlaylistCallback;
  }
  ionViewDidLoad() {
    document.getElementsByTagName("ion-app").item(0).classList.add("disable-scroll");
    
      this.storage.get(USER_DATA_KEY).then(userData => {
        this.videoService.isDownloaded(this.videoDetails.bcid, userData.id).then(isDownloaded => {
          this.isVideoDownloaded = isDownloaded;

          let obs = this.videoService.getInProgressDownload(this.videoDetails.bcid);
          if (obs) {
            this.observeInProgressDownload(this.videoDetails.bcid, obs);
          }
        }).catch(e => {
          console.log(e);
        });
      })
    
  }

  ionViewWillLeave() {
    if (document.getElementsByTagName("ion-app").item(0).classList.contains("disable-scroll"))
      document.getElementsByTagName("ion-app").item(0).classList.remove("disable-scroll");
  }
  removeFromPlaylist() {
    this.viewCtrl.dismiss();
    this.playlistService.removeVideoFromPlaylist(this.videoDetails.bcid).then(isSuccessful => {
      if (this.refreshPlaylistCallback) {
        this.refreshPlaylistCallback();
      }

      if (isSuccessful) {
        let alert = this.alertController.create({
          title: 'Removed from playlist',
          message: 'The video has been successfully removed from your playlist!',
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

  download() {
    this.viewCtrl.dismiss();
    this.storage.get(USER_DATA_KEY).then(userData => {
      if (userData) {
        return this.videoService.download(this.videoDetails.bcid, userData.id, userData.email);
      } else {
        throw new Error('not_logged_in');
      }
    }).then(observable => {
      this.observeInProgressDownload(this.videoDetails.bcid, observable);
      observable.subscribe(progress => { }, e => { }, () => {
        let alert = this.alertController.create({
          title: 'Download Video',
          message: 'The video has been successfully downloaded!',
          buttons: [{
            text: 'OK', handler: () => {
              this.viewCtrl.dismiss();
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
            this.navCtrl.push(FallbackPage);
            break;
          case 'already_downloaded':
            console.log('Video has already been downloaded by the user.');
            let alert = this.alertController.create({
              title: 'Oops!',
              message: 'You already downloaded this video.',
              buttons: [{
                text: 'OK', handler: () => {
                  alert.dismiss();
                  return true;
                }
              }]
            });
            alert.present();
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
  private observeInProgressDownload(id: string, observable: Observable<number>) {
    this.downloadProgress = 0;
    this.isVideoDownloading = true;

    observable.subscribe(progress => {
      this.downloadProgress = progress;
      this.ref.detectChanges();
    }, e => {
      console.log(e);
      this.isVideoDownloading = false;
      this.downloadService.showDownloadErrorFinishAlertFor(this.videoDetails.bcid);
    }, () => {
      this.isVideoDownloading = false;
      this.downloadService.showDownloadFinishAlertFor(this.videoDetails.bcid);
    });
  }
}