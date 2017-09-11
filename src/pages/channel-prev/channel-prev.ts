import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, PopoverController } from 'ionic-angular';
import { PopoverPage } from "../../app/popover";
import { Http, RequestOptions, Headers, URLSearchParams } from "@angular/http";

@Component({
  selector: 'page-channel-prev',
  templateUrl: 'channel-prev.html',
})
export class ChannelPrevPage {
  
  channelCover: string;
  id:string=null;
  channelDetail=[];
  
  private descLabel:string = 'md-arrow-dropdown';
  private isDescriptionShown: boolean = false;
  constructor(public navCtrl: NavController, public navParams: NavParams, public popoverCtrl: PopoverController,
  private http: Http) {
    this.getChannelDatails();
  }

  getChannelDatails(){
    this.id=null;
    this.channelDetail=[];
    this.id=this.navParams.get('id');

    let body = new URLSearchParams();
    body.set('action', 'Channel_GetDetails');
    body.set('id', this.id);

    let options = new RequestOptions({
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    });

    this.http.post('http://cums.the-v.net/site.aspx', body)
      .subscribe(response => {
         let data = response.json().map(ch =>{
           ch.channelImageFinalUrl = "http://the-v.net/Widgets_Site/J-Gallery/Image.ashx?type=channel&id="+ch.id;
           return ch;
         })
          this.channelDetail=data[0];
          if(data[0].cover==""){
            this.channelCover= "http://the-v.net/Widgets_Site/J-Gallery/Image.ashx?type=channelcover&id="+data[0].id;
          }
          else{
            this.channelCover=data[0].cover;
          }
      }, e=>{
        console.log(e);
       }, () => {
      });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ChannelPrevPage');
  }
  presentPopover(myEvent) {
    let popover = this.popoverCtrl.create(PopoverPage);
    popover.present({
      ev: myEvent
    });
  }
  seeDesc(){
    this.isDescriptionShown = !this.isDescriptionShown;
    this.descLabel= this.isDescriptionShown ? 'md-arrow-dropup' : 'md-arrow-dropdown';
  }

}
