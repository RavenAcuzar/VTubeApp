import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, AlertController } from 'ionic-angular';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import { File, FileEntry } from '@ionic-native/file';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { MediaCapture, MediaFile, CaptureError, CaptureImageOptions } from '@ionic-native/media-capture';
import { Http, Headers, RequestOptions, URLSearchParams } from "@angular/http";
import { Storage } from '@ionic/storage';
import { USER_DATA_KEY } from "../../app/app.constants";
import { encodeObject } from "../../app/app.utils";
import { UploadService } from "../../app/services/upload.service";
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';


@Component({
  selector: 'page-upload-video',
  templateUrl: 'upload-video.html',
})
export class UploadVideoPage {
  sendDisabled: boolean = false;
  uploadStatus: string;
  hideProgress: boolean =true;
  Uploadprogress: number;
  alertMessage: string;
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
    private uploadSrvc: UploadService,
    private alertController: AlertController) {
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

  ionViewDidEnter() {
    this.tryObserveToUploadStatus();
  }

  ionViewDidLeave() {

  }
  resetContentPage(){
    this.sendDisabled = false;
    this.hideProgress =true;
    this.hidePlayer = true;
    this.vidSrc = '';
    this.categories = [];
    this.levels = [];
    this.locs = [];
    this.title = '';
    this.description = '';
    this.tags = '';
    this.privacy = 'public';
    this.category = '';
    this.level = '';
    this.targetMarketLoc = [];
    this.allowComment = '0';
    this.allowSharing = '0';
  }

  sendVideo() {
    //verify entries
    //if valid, execute upload
    if (this.formValidate()) {
      this.uploadSrvc.uploadVideo({
        source: this.vidSrc,
        title: this.title,
        description: this.description,
        tags: this.tags,
        category: this.category,
        level: this.level,
        targetMarketLoc: this.targetMarketLoc.toString(),
        allowComment: this.allowComment,
        allowSharing: this.allowSharing,
        privacy: this.privacy
      }).then(observable => {
        this.trySubscribeToUploadProgress(observable);
      });
    }
    else {
      let alert = this.alertController.create({
        title: 'Error Uploading Video!',
        buttons: [{
          text: 'OK', handler: () => {
            alert.dismiss();
            return true;
          }
        }]
      }).setMessage(this.alertMessage);
      alert.present();
    }
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
      this.alertMessage = "Name/Description Empty. Please fill up all required fields.";
      return false;
    }
    else if (this.tags == '') {
      // set video tags value to none
      this.alertMessage = "Please enter a tag for the video.";
      return false;
    }
    else if (this.category == '') {
      //show alert category
      this.alertMessage = "Please select the video category.";
      return false;
    }
    else if (this.level == '') {
      //show alert level
      this.alertMessage = "Please select the video level.";
      return false;
    }
    else if (this.targetMarketLoc == []) {
      //show alert targetLoc
      this.alertMessage = "Please select the market location.";
      return false;
    }
    else {
      return true;
    }
  }

  captureVid() {
    let options: CaptureImageOptions = {
      limit: 1
    }
    this.mediaCapture.captureVideo(options).then((data: MediaFile[]) => {
      this.hidePlayer = false;
      this.selectedVid = data;

      if (this.platform.is('ios')) {
        this.vidSrc = 'file://' + data[0].fullPath;
      } else if (this.platform.is('android')) {
        this.vidSrc = data[0].fullPath;
      } else {
        throw new Error('Platform not supported.');
      }
    }, (err: CaptureError) => console.error(err));
  }

  private tryObserveToUploadStatus(observable?: Subject<number>) {
    // check if there are upload in progress
    if (this.uploadSrvc.isAnUploadInProgress()) {
      let status = this.uploadSrvc.getCurrentUploadStatus();

      if (status === UploadService.VIDEO_UPLOADING) {
        // if the in progress upload is at VIDEO_UPLOADING status
        this.trySubscribeToUploadProgress();
      } else {
        // do the appropriate action accdg to the status
        this.doActionBasedOnStatus(status);
      }
    }

    // subscribe to changes in the upload status of the video
    this.uploadSrvc.getCurrentUploadStatusObservable().subscribe(status => {
      this.doActionBasedOnStatus(status);
    });
  }

  private trySubscribeToUploadProgress(readyObservable?: Subject<number>) {
    let observable: Subject<number>, canSubscribeToObservable: boolean = false;

    if (!readyObservable) {
      observable = this.uploadSrvc.getInProgressUploadObservable();
      canSubscribeToObservable = observable !== null;
    } else {
      observable = readyObservable;
      // check if the passed observable is valid
      if (observable) {
        canSubscribeToObservable = true;
      }
    }

    if (canSubscribeToObservable) {
      observable.subscribe(progress => {
        this.Uploadprogress = progress;
      });
    }
  }
  private cancelUpload() {
    this.uploadSrvc.cancelUpload();
  }

  private doActionBasedOnStatus(status: number) {
    switch (status) {
      case UploadService.NOT_UPLOADING:
        break;
      case UploadService.PREPARING_VIDEO_UPLOAD:
        this.sendDisabled = true;
        this.uploadStatus = "Preparing your video...";
        break;
      case UploadService.SAVING_VIDEO_DETAILS:
        this.uploadStatus = "Saving video details...";
        break;
      case UploadService.STARTING_VIDEO_UPLOAD:
        this.uploadStatus = "Starting upload...";
        break;
      case UploadService.VIDEO_UPLOADING:
        this.uploadStatus = '';
        this.hideProgress = false;
        this.trySubscribeToUploadProgress();
        break;
      case UploadService.SENDING_VIDEO_DETAILS:
        break;
      case UploadService.FINISHED_VIDEO_UPLOAD:
        {
          this.sendDisabled = false;
          this.hideProgress = true;
          this.hidePlayer = true;
          this.uploadStatus = '';
          this.resetContentPage();
          //show alert
          let alert = this.alertController.create({
            title: "Upload Finished!",
            message: "Your video has been uploaded. We will review your video before its public.",
            buttons: [{
              text: 'OK',
              handler: () => {
                alert.dismiss();
                return false;
              }
            }]
          })
          alert.present()
        }
        break;
      case UploadService.ERROR_UPLOAD_CANCELLED:
        {
          this.sendDisabled = false;
          this.hideProgress = true;
          this.hidePlayer = true;
          this.uploadStatus = '';
          //show alert
          let alert = this.alertController.create({
            title: "Upload Cancelled!",
            message: "You cancelled your upload.",
            buttons: [{
              text: 'OK',
              handler: () => {
                alert.dismiss();
                return false;
              }
            }]
          })
          alert.present();
        }
        break;
      case UploadService.ERROR_DURING_DETAILS_SAVE:
        break;
      case UploadService.ERROR_DURING_UPLOAD:
        break;
      case UploadService.ERROR_DURING_DETAILS_SEND:
      {
        this.sendDisabled = false;
        this.hideProgress = true;
        this.hidePlayer = false;
        this.uploadStatus = '';
        this.resetContentPage();
        //show alert
        let alert = this.alertController.create({
          title: "Error Upload!",
          message: "An error encountered while uploading. Please contact your administrator.",
          buttons: [{
            text: 'OK',
            handler: () => {
              alert.dismiss();
              return false;
            }
          }]
        })
        alert.present();
      }
        break;
      default:
        throw new Error('never_gonna_exec');
    }
  }
}