import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, PopoverController, AlertController, InfiniteScroll } from 'ionic-angular';
import { HomePopoverPage } from "../../app/popover";
import { ChannelPrevPage } from "../channel-prev/channel-prev";
import { SearchPage } from "../search/search";
import { Http, RequestOptions, Headers, URLSearchParams } from "@angular/http";
import { Storage } from '@ionic/storage';
import { USER_DATA_KEY, IS_LOGGED_IN_KEY } from "../../app/app.constants";
import { NowPlayingPage } from "../now-playing/now-playing";
import { FallbackPage } from "../fallback/fallback";
import { numberFormat } from "../../app/app.utils";

@Component({
  selector: 'page-channels',
  templateUrl: 'channels.html',
})
export class ChannelsPage {
  userHasChannel: boolean;
  userChannelId: any;
  channelVids = [];
  hasVids=false;
  followingChannels = [];
  recommendedChannels = [];
  allChannels = [];
  userChannel =[];
  channelAvatar = 'http://site.the-v.net/Widgets_Site/J-Gallery/Image.ashx?type=channel&id=';
  channelCover;
  num = 1;
  num2=1;
  page = 1;
  private descLabel: string = 'md-arrow-dropdown';
  private isDescriptionShown: boolean = false;
  isLoggedOut: Boolean;
  channelType: string = "myChannel";

  constructor(public navCtrl: NavController, public navParams: NavParams, protected popoverCtrl: PopoverController,
    private http: Http, private storage: Storage, private alertCtrl: AlertController) {

  }

  ionViewDidEnter() {
    this.checkUserifLoggedIn();
    if(!this.isLoggedOut){
      this.getUserChannel();
      this.getChannelFollowing();
    }
    this.getChannelRecommended(this.num2.toString());
    this.getChannelAll(this.num.toString());
  }

  presentPopover(myEvent, vids) {
    let popover = this.popoverCtrl.create(HomePopoverPage, {
      videoDetails: vids
    });
    popover.present({
      ev: myEvent
    });
  }
  getChannelFollowing() {
    this.storage.get(USER_DATA_KEY).then(userDetails => {
      let id = userDetails.id;

      let body = new URLSearchParams();
      body.set('action', 'App_UserFollowing');
      body.set('userid', id);

      let options = new RequestOptions({
        headers: new Headers({
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      });

      this.http.post('http://cums.the-v.net/site.aspx', body, options)
        .subscribe(response => {
          this.followingChannels =response.json().map(c => {
            c.finalAvatarUrl = this.channelAvatar + c.channelId;
            return c
          })
        }, e => {
          console.log(e);
        }, () => {
        });
    })

  }

  getChannelRecommended(num) {
    let body = new URLSearchParams();
    body.set('action', 'Channel_GetRecommended');
    body.set('count', '10');
    body.set('page', num);

    let options = new RequestOptions({
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    });

    this.http.post('http://cums.the-v.net/site.aspx', body, options)
      .subscribe(response => {
        this.recommendedChannels = this.recommendedChannels.concat(response.json().map(c => {
          c.finalAvatarUrl = this.channelAvatar + c.id;
          c.chFollowers = numberFormat(c.followers);
          return c
        }))
      }, e => {
        console.log(e);
      }, () => {
      });
  }

  getChannelAll(num) {
    let body = new URLSearchParams();
    body.set('action', 'Channel_GetModerator');
    body.set('count', '10');
    body.set('page', num);

    let options = new RequestOptions({
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    });

    this.http.post('http://cums.the-v.net/site.aspx', body, options)
      .subscribe(response => {
        this.allChannels = this.allChannels.concat(response.json().map(c => {
          c.finalAvatarUrl = this.channelAvatar + c.id;
          c.chFollowers = numberFormat(c.followers);
          return c
        }))
      }, e => {
        console.log(e);
      }, () => {
      });
  }
  loadMoreRecommended(){
    this.num +=1;
    this.getChannelRecommended(this.num.toString());
  }
  loadMoreChannel(){
    this.num2+=1;
    this.getChannelAll(this.num2.toString());
  }
  checkUserifLoggedIn(){
    this.storage.get(IS_LOGGED_IN_KEY).then(isloggedin=>{
      if(isloggedin)
        this.isLoggedOut=false;
      else
        this.isLoggedOut=true;
    })
  }

  getUserChannel() {
    this.storage.get(USER_DATA_KEY).then(userDetails => {
      let id = userDetails.id;

      let body = new URLSearchParams();
      body.set('action', 'DDrupal_UserChannel');
      body.set('userid', id);

      let options = new RequestOptions({
        headers: new Headers({
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      });

      this.http.post('http://cums.the-v.net/site.aspx', body, options)
        .subscribe(response => {
          let data = response.json().map(c => {
            c.finalAvatarUrl = 'http://site.the-v.net/' + c.thumbnail;
            c.chViews = numberFormat(c.views);
            c.chVidsCount = numberFormat(c.videoCount);
            c.chFollowers = numberFormat(c.followers);
            return c
          })
          if (data.length > 0) {
            this.userHasChannel = true;
            this.userChannel = data[0];
            this.userChannelId = data[0].id;
            this.getChannelVids(data[0].id);
            this.channelCover = [data[0].cover.slice(0,7), 'site.', data[0].cover.slice(7)].join('');
          } else {
            //do something here if no channel is available
            this.userHasChannel = false;
            console.log("No user channel available");
          }
        }, e => {
          console.log(e);
        }, () => {
        });
    })
  }
  loadMoreChannelVids(infiniteScroll: InfiniteScroll){
    this.page+=1;
    this.getChannelVids(this.userChannelId, ()=>{
      infiniteScroll.complete();
    });
  }

  getChannelVids(cId, callback?) {

    let body = new URLSearchParams();
    body.set('action', 'Video_GetByChannel');
    body.set('count', '10');
    body.set('id', cId);
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
        if  (callback)
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

  userCheckSubscription() {
    return this.storage.get(USER_DATA_KEY).then(userDetails => {
      return (userDetails.membership !== "Free")
    })
  }

  goToChannelView(id : string) {
    this.navCtrl.push(ChannelPrevPage, {
      id: id
    });
  }
  searchThing() {
    this.navCtrl.push(SearchPage);
  }
  
  goToFallback() {
    this.navCtrl.push(FallbackPage);
  }
  seeDesc() {
    this.isDescriptionShown = !this.isDescriptionShown;
    this.descLabel = this.isDescriptionShown ? 'md-arrow-dropup' : 'md-arrow-dropdown';
  }
}
