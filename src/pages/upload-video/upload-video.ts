import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import { File, FileEntry } from '@ionic-native/file';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { MediaCapture, MediaFile, CaptureError, CaptureImageOptions } from '@ionic-native/media-capture';
import { Http, Headers, RequestOptions, URLSearchParams } from "@angular/http";
import { Storage } from '@ionic/storage';
import { USER_DATA_KEY } from "../../app/app.constants";
import { encodeObject } from "../../app/app.utils";
import { UploadService } from "../../app/services/upload.service";
/**
 * Generated class for the UploadVideoPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@Component({
  selector: 'page-upload-video',
  templateUrl: 'upload-video.html',
})
export class UploadVideoPage {
  selectedVid: MediaFile[];
  hidePlayer: boolean = true;
  vidSrc = '';
  categories = [];
  levels = [];
  locs = [];
  title = '';
  description = '';
  tags = '';
  privacy = 'public';
  category = '';
  level = '';
  targetMarketLoc = [];
  allowComment = '0';
  allowSharing = '0';
  vidValue;
  fileTransfer: FileTransferObject = this.transfer.create();

  constructor(public navCtrl: NavController, public navParams: NavParams,
    private transfer: FileTransfer,
    private file: File,
    private camera: Camera,
    private mediaCapture: MediaCapture,
    private platform: Platform,
    private http: Http,
    private storage: Storage,
    private uploadSrvc: UploadService) {
    this.categories = [
      { title: 'Entertainment', value: 'Entertainment' },
      { title: 'Messages', value: 'Messages' },
      { title: 'Products', value: 'Products' },
      { title: 'Highlights', value: 'Highlights' },
      { title: 'Bissiness Methods', value: 'Bissiness Methods' },
      { title: 'Film and Animation', value: 'Film and Animation' },
      { title: 'Testimonials', value: 'Testimonials' },
      { title: 'Personal Development', value: 'Personal Development' },
      { title: 'Annoucements', value: 'Annoucements' },
      { title: 'Multilingual', value: 'Multilingual' },
      { title: 'Causes and Non-profits', value: 'Causes and Non-profits' }
    ]
    this.levels = [
      { title: 'General', value: 'General' },
      { title: 'Beginner', value: 'Beginner' },
      { title: 'Intermediate', value: 'Intermediate' },
      { title: 'Advanced', value: 'Advanced' },
      { title: 'Platinum', value: 'Platinum' },
    ]
    this.locs = [
      { title: 'Africa' },
      { title: 'Australia' },
      { title: 'Central Asia' },
      { title: 'East Asia' },
      { title: 'Europe' },
      { title: 'Middle East' },
      { title: 'North America' },
      { title: 'Pacific Islands' },
      { title: 'South America' },
      { title: 'South Asia' },
      { title: 'Southeast Asia' }
    ]
  }

  ionViewDidLoad() {
    
  }

  sendVideo() {
    //verify entries
    //if valid, execute upload
    this.uploadSrvc.uploadVideo(
      this.vidSrc,this.title,
      this.description,this.tags,
      this.category,this.level, 
      this.targetMarketLoc,this.allowComment,
      this.allowSharing,this.privacy);
  }

  selectVid() {
    let options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.FILE_URI,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      mediaType: this.camera.MediaType.VIDEO
    }
    this.camera.getPicture(options).then(ii => {
      if (this.platform.is('ios')) {
        this.vidSrc = ii;
      } else if (this.platform.is('android')) {
        this.vidSrc = 'file://' + ii;
      } else {
        throw new Error('Platform not supported.');
      }
      this.hidePlayer = false;
    });
  }

  formValidate() {
    if ((this.title == '') || (this.description == '')) {
      //show alert title
      return false;
    }
    if ( this.tags== '') {
      // set video tags value to none
      return false;
    }
    if (this.category == '') {
      //show alert category
      return false;
    }
    if (this.level == '') {
      //show alert level
      return false;
    }
    if (this.targetMarketLoc == []) {
      //show alert targetLoc
      return false;
    }
  }

  captureVid() {
    let options: CaptureImageOptions = {
      limit: 1
    }
    this.mediaCapture.captureVideo(options).then(
      (data: MediaFile[]) => {
        this.selectedVid = data;
        if (this.platform.is('ios')) {
          this.vidSrc = 'file://' + data[0].fullPath;
        } else if (this.platform.is('android')) {
          this.vidSrc = data[0].fullPath;
        } else {
          throw new Error('Platform not supported.');
        }
        console.log(data);
        this.hidePlayer = false;
      },
      (err: CaptureError) => console.error(err)
    );
  }
}
