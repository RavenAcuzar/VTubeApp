import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, PopoverController, ViewController, AlertController } from 'ionic-angular';
import { PlaylistService } from "../../app/services/playlist.service";
import { Storage } from "@ionic/storage";
import { USER_DATA_KEY } from "../../app/app.constants";
import { VideoService } from "../../app/services/video.service";
import { VideoDetails } from "../../app/models/video.models";
import { FallbackPage } from "../fallback/fallback";
import { PlaylistPopoverPage } from "../../app/popover";

@Component({
  selector: 'page-playlist',
  templateUrl: 'playlist.html',
})
export class PlaylistPage {

  private playlistVideos: VideoDetails[] = [];

  constructor(
    private navCtrl: NavController,
    private storage: Storage,
    private playlistService: PlaylistService,
    private videoService: VideoService,
    private popoverCtrl: PopoverController
  ) { }

  ionViewDidEnter() {
    this.refreshPlaylist();
  }

  showPopover(event: any, videoDetail: VideoDetails) {
    let popover = this.popoverCtrl.create(PlaylistPopoverPage, {
      videoDetails: videoDetail,
      refreshPlaylistCallback: () => {
        this.refreshPlaylist();
      }
    });
    popover.present({ ev: event });
  }

  refreshPlaylist() {
    this.storage.get(USER_DATA_KEY).then(userData => {
      if (userData) {
        return this.playlistService.getPlaylistOf(userData.id);
      } else {
        throw new Error('user_not_logged_in');
      }
    }).then(entries => {
      return Promise.all(entries.map(entry => {
        return this.videoService.getDetails(entry.bcid);
      }));
    }).then(videoDetails => {
      this.playlistVideos = videoDetails;
    }).catch(e => {
      console.error(JSON.stringify(e));
    });
  }
}