import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, PopoverController, ViewController, AlertController } from 'ionic-angular';
import { DownloadService } from "../../app/services/download.service";
import { Storage } from '@ionic/storage';
import { USER_DATA_KEY } from "../../app/app.constants";
import { DownloadEntry } from "../../app/models/download.models";
import { PlayDownloadedVideoPage } from "../play-downloaded-video/play-downloaded-video";

@Component({
  selector: 'page-downloads',
  templateUrl: 'downloads.html',
})
export class DownloadsPage {

  private downloadedVideos: DownloadEntry[] = [];

  constructor(
    private storage: Storage,
    private alertCtrl: AlertController,
    private downloadService: DownloadService,
    private navCtrl: NavController
  ) { }

  ionViewDidEnter() {
    this.storage.get(USER_DATA_KEY).then(userData => {
      if (userData) {
        return this.downloadService.getDownloadedVideosOf(userData.id);
      } else {
        throw new Error('user_not_logged_in');
      }
    }).then(downloadedVideos => {
      this.downloadedVideos = downloadedVideos;
    });
  }

  playVideo(entry: DownloadEntry) {
    this.navCtrl.push(PlayDownloadedVideoPage, {
      id: entry.id
    });
  }

  deleteEntry(entry: DownloadEntry) {
    let confirm = this.alertCtrl.create({
      title: 'Delete video?',
      message: `Are you sure you want to remove the downloaded copy of '${entry.title}'?`,

      buttons: [
        {
          text: 'Yes',
          handler: () => {
            this.storage.get(USER_DATA_KEY).then(userData => {
              return this.downloadService.removeVideoFor(userData.id, entry.bcid)
                .then(isSuccessful => {
                  return {
                    isSuccessful: isSuccessful,
                    userId: userData.id
                  }
                })
            }).then(data => {
              let title = '';
              let message = '';
        
              if (data.isSuccessful) {
                title = 'Downloaded video removed!';
                message = 'The downloaded video was successfully removed.';
              } else {
                title = 'Oh no!';
                message = 'The downloaded video you wanted to delete was not successfully removed.';
              }
        
              let alert = this.alertCtrl.create({
                title: title,
                message: message,
                buttons: [{
                  text: 'Ok',
                  handler: () => {
                    alert.dismiss();
                    return true;
                  }
                }]
              })
              alert.present();
        
              return this.downloadService.getDownloadedVideosOf(data.userId);
            }).then(downloadedVideos => {
              this.downloadedVideos = downloadedVideos;
            });
            confirm.dismiss();
            return true;
          }
        }, {
          text: 'No',
          handler: () => {
            confirm.dismiss();
            return true;
          }
        }
      ]
    })
    confirm.present();
  }
}
