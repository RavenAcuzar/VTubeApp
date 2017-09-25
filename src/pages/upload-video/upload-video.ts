import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import { File } from '@ionic-native/file';
import { Camera, CameraOptions } from '@ionic-native/camera';
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
  categories = [];
  levels = [];
  locs = [];
  title = '';
  description = '';
  tags = '';
  privacy = '';
  category = '';
  level = '';
  targetMarketLoc = [];
  allowComment = '';
  allowSharing = '';
  vidValue;
  fileTransfer: FileTransferObject = this.transfer.create();

  constructor(public navCtrl: NavController, public navParams: NavParams,
    private transfer: FileTransfer,
    private file: File,
    private camera: Camera) {
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
    //open file picker here
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.VIDEO
    }
    this.camera.getPicture(options).then(ii=>{
      this.vidValue = ii;
    });
  }

  uploadVid() {

    console.log("Upload Video Clicked!")
    let options: FileUploadOptions = {
      fileKey: 'file',
      fileName: 'name.jpg',
      headers: {}
    }

    this.fileTransfer.upload('<file path>', '<api endpoint>', options)
      .then((data) => {
        // success
      }, (err) => {
        // error
      })
  }

}
