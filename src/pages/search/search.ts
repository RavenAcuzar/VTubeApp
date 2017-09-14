import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, PopoverController } from 'ionic-angular';
import { Http, RequestOptions, Headers, URLSearchParams } from "@angular/http";
import { IS_LOGGED_IN_KEY, USER_DATA_KEY } from "../../app/app.constants";
import { NowPlayingPage } from "../now-playing/now-playing";
import { FallbackPage } from "../fallback/fallback";
import { Storage } from "@ionic/storage"
import { HomePopoverPage } from "../../app/popover";

@Component({
  selector: 'page-search',
  templateUrl: 'search.html',
})
export class SearchPage {

  SearchResults = [];
  keyword = '';
  hideResults = true;
  constructor(public navCtrl: NavController, 
    private alertCtrl: AlertController, 
    public navParams: NavParams, 
    private http: Http,
    private storage: Storage,
    private popoverCtrl: PopoverController) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SearchPage');
  }

  onInput() {
    if(this.keyword===''){
      this.SearchResults = [];
      this.hideResults = true;
    }else{
      this.hideResults = false;
    this.SearchResults = [];
    let details = [];
    let body = new URLSearchParams();
    body.set('action', 'App_Search');
    body.set('keyword', this.keyword);

    let options = new RequestOptions({
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    });

    this.http.post('http://cums.the-v.net/site.aspx', body, options)
      .subscribe(response => {
        let data = response.json();
        data.forEach(sr => {
          this.getVideoDetails(sr.URL).subscribe(response => {
            details = response.json();
            sr.viewsNo = details[0].views;
            sr.chName = details[0].channelName;
            sr.vidImage = "http://the-v.net" + details[0].image;
            sr.vidPoints = details[0].points;
            sr.noLock = (details[0].videoPrivacy === 'public');
            sr.vidPriv = details[0].videoPrivacy;
          }, e => {
            console.log(e);
          }, () => {
          });
          return sr;
        })
        this.SearchResults = data;
      }, e => {
        console.log(e);
      }, () => {
      });
    }
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
        this.navCtrl.push(FallbackPage);
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
  userCheckSubscription() {
    return this.storage.get(USER_DATA_KEY).then(userDetails => {
      return (userDetails.membership !== "Free")
    })
  }
  getVideoDetails(bcid) {
    let body = new URLSearchParams();
    body.set('action', 'Video_GetDetails');
    body.set('bcid', bcid);

    let options = new RequestOptions({
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    });
    return this.http.post('http://cums.the-v.net/site.aspx', body, options)
  }
  presentPopover(myEvent, vids) {
    let popover = this.popoverCtrl.create(HomePopoverPage, {
      videoDetails: vids
    });
    popover.present({
      ev: myEvent
    });
  }

  onCancel() {
    
  }
}
