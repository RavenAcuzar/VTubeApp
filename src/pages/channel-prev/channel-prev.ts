import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, PopoverController, AlertController, InfiniteScroll } from 'ionic-angular';
import { PopoverPage } from "../../app/popover";
import { Http, RequestOptions, Headers, URLSearchParams } from "@angular/http";
import { Storage } from "@ionic/storage";
import { IS_LOGGED_IN_KEY, USER_DATA_KEY } from "../../app/app.constants";
import { NowPlayingPage } from "../now-playing/now-playing";
import { FallbackPage } from "../fallback/fallback";

@Component({
  selector: 'page-channel-prev',
  templateUrl: 'channel-prev.html',
})
export class ChannelPrevPage {

  channelCover: string;
  id: string = null;
  channelDetail = [];
  channelVids = [];
  hasVids = true;
  page =1;

  private descLabel: string = 'md-arrow-dropdown';
  private isDescriptionShown: boolean = false;
  constructor(public navCtrl: NavController, public navParams: NavParams, public popoverCtrl: PopoverController,
    private http: Http, private storage: Storage,
    private alertCtrl: AlertController) {
    this.getChannelDatails();
    this.getChannelVids();
  }

  getChannelDatails() {
    this.id = null;
    this.channelDetail = [];
    this.id = this.navParams.get('id');

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
        let data = response.json().map(ch => {
          ch.channelImageFinalUrl = "http://the-v.net/Widgets_Site/J-Gallery/Image.ashx?type=channel&id=" + ch.id;
          return ch;
        })
        this.channelDetail = data[0];
        if (data[0].cover == "") {
          this.channelCover = "http://the-v.net/Widgets_Site/J-Gallery/Image.ashx?type=channelcover&id=" + data[0].id;
        }
        else {
          this.channelCover = data[0].cover;
        }
      }, e => {
        console.log(e);
      }, () => {
      });
  }
  getChannelVids(callback?) {
    this.id = null;
    this.id = this.navParams.get('id');

    let body = new URLSearchParams();
    body.set('action', 'Video_GetByChannel');
    body.set('count', '10');
    body.set('id', this.id);
    body.set('page', this.page.toString());

    let options = new RequestOptions({
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    });

    this.http.post('http://cums.the-v.net/site.aspx', body)
      .subscribe(response => {
        this.channelVids = this.channelVids.concat(response.json());
        if (this.channelVids.length <= 0) {
          this.hasVids = false;
        }
        else {
          this.hasVids = true;
          this.channelVids.map(cv => {
            cv.noLock = (cv.videoPrivacy === 'public');
            return cv;
          })
        }
        if (callback)
          callback();
      }, e => {
        console.log(e);
      }, () => {
      });
  }
    
  playVideo(id: string, videoPrivacy: string) {
    this.storage.get(IS_LOGGED_IN_KEY).then(loggedIn => {
      if (videoPrivacy == "public") {
        //go to vid
        this.navCtrl.push(NowPlayingPage, {
          id: id
        });
      }
      else if (!loggedIn && videoPrivacy == "private") {
        //go to fallback
        this.goToFallback();
      } else if (loggedIn && videoPrivacy == "private") {
        //check subscription
        this.userCheckSubscription().then(sub => {
          if (sub) {
            this.navCtrl.push(NowPlayingPage, {
              id: id
            });
          }
          else {
            let alert = this.alertCtrl.create({
              title: 'Upgrade to premium',
              message: 'Upgrade to premium account to access this feature.',
              buttons: [{
                text: 'OK',
                handler: () => {
                  alert.dismiss();
                  return false;
                }
              }
              ]
            })
            alert.present();
          }
          //if true go to vid
          //else show alert- prompt user to upgrade subscrption
        })
      }
    })

  }
  loadMoreChannelVids(infiniteScroll: InfiniteScroll){
    this.page+=1;
    this.getChannelVids(()=>{
      infiniteScroll.complete();
    });
  }

  userCheckSubscription() {
    return this.storage.get(USER_DATA_KEY).then(userDetails => {
      return (userDetails.membership !== "Free")
    })
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
  goToFallback() {
    this.navCtrl.push(FallbackPage);
  }
  seeDesc() {
    this.isDescriptionShown = !this.isDescriptionShown;
    this.descLabel = this.isDescriptionShown ? 'md-arrow-dropup' : 'md-arrow-dropdown';
  }

}
