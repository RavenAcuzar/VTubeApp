import { Component } from '@angular/core';
import { NavController, PopoverController, InfiniteScroll, AlertController } from 'ionic-angular';
import { HomePopoverPage } from "../../app/popover";
import { NowPlayingPage } from "../now-playing/now-playing";
import { SearchPage } from "../search/search";
import { FallbackPage } from "../fallback/fallback";
import { Http, RequestOptions, Headers, URLSearchParams } from "@angular/http";
import { Storage } from '@ionic/storage';
import { IS_LOGGED_IN_KEY, USER_DATA_KEY } from "../../app/app.constants";


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  freeVids = [];
  premiumVids = [];
  channelDetail;
  numvids = 1;

  vidType: string = "freeVid";
  constructor(public navCtrl: NavController, protected popoverCtrl: PopoverController,
    public http: Http, private storage: Storage, private alertCtrl: AlertController) {
    this.getFreeVids(this.numvids.toString());
    this.getPremVids(this.numvids.toString());
  }
  ionViewDidLoad(){
    this.http.get('http://cums.the-v.net/upgrade.aspx')
    .subscribe(response => {
      console.log(response);
      if(response.json()){
        let youralert = this.alertCtrl.create({
          title: "Your VTube+ App is outdated!",
          message: "Download the new version of Vtube+ App now!",
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                console.log('Cancel clicked');
              }
            }
          ]
        });
        youralert.present();
      }
    }, e => {
      console.log(e);
    }, () => {
    });
  }
  presentPopover(myEvent, vids) {
    let popover = this.popoverCtrl.create(HomePopoverPage, {
      videoDetails: vids
    });
    popover.present({
      ev: myEvent
    });
  }

  loadMoreFree(infiniteScroll: InfiniteScroll) {
    this.numvids += 1;
    this.getFreeVids(this.numvids.toString(), () => {
      infiniteScroll.complete();
    });
  }
  loadMorePrem(infiniteScroll: InfiniteScroll) {
    this.numvids += 1;
    this.getPremVids(this.numvids.toString(), () => {
      infiniteScroll.complete();
    });
  }

  getPremVids(num, callback?) {
    let body = new URLSearchParams();
    body.set('action', 'Video_GetByLevel');
    body.set('count', '10');
    body.set('level', 'Intermediate');
    body.set('page', num);

    let options = new RequestOptions({
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    });

    this.http.post('http://cums.the-v.net/site.aspx', body, options)
      .subscribe(response => {
        this.premiumVids =this.premiumVids.concat(response.json());
        this.premiumVids.forEach(fv => {
          this.channelAvatar(fv);
        })
        if (callback)
          callback();
      }, e => {
        console.log(e);
      }, () => {
      });
  }

  getFreeVids(num, callback?) {
    let body = new URLSearchParams();
    body.set('action', 'Video_GetByLevel');
    body.set('count', '10');
    body.set('level', 'Beginner');
    body.set('page', num);

    let options = new RequestOptions({
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    });

    this.http.post('http://cums.the-v.net/site.aspx', body, options)
      .subscribe(response => {
        this.freeVids = this.freeVids.concat(response.json().filter((v) => {
          return v.videoPrivacy === 'public';
        }));
        this.freeVids.forEach(fv => {
          this.channelAvatar(fv);
        })
        if (callback)
          callback();
      }, e => {
        console.log(e);
      }, () => {
      });
  }
  channelAvatar(fv) {
    fv.channelImage = null;

    let body = new URLSearchParams();
    body.set('action', 'Channel_GetDetails');
    body.set('id', fv.channelId);

    let options = new RequestOptions({
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    });

    this.http.post('http://cums.the-v.net/site.aspx', body, options)
      .subscribe(response => {
        let channelDetail = response.json();
        fv.channelImage = 'http://site.the-v.net/Widgets_Site/J-Gallery/Image.ashx?type=channel&id=' + channelDetail[0].channelUrl;
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
  userCheckSubscription() {
    return this.storage.get(USER_DATA_KEY).then(userDetails => {
      return (userDetails.membership !== "Free")
    })
  }
  searchThing() {
    this.navCtrl.push(SearchPage);
  }
  goToFallback() {
    this.navCtrl.push(FallbackPage);
  }
}


