import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { DownloadService } from "../../app/services/download.service";

@Component({
  selector: 'page-play-downloaded-video',
  templateUrl: 'play-downloaded-video.html',
})
export class PlayDownloadedVideoPage {

  private vidId;
  private vidSource = '';
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    private downloadSrvc: DownloadService
  ) { 
    this.vidId= navParams.get('id');
    this.vidSource = this.downloadSrvc.getPathOfVideo(this.vidId);
  }

  ionViewDidLoad() {
    
  }
}
