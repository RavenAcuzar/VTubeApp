import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, PopoverController } from 'ionic-angular';
import { PopoverPage } from "../../app/popover";
import { ChannelPrevPage } from "../channel-prev/channel-prev";
import { SearchPage } from "../search/search";
import { Http, RequestOptions, Headers, URLSearchParams } from "@angular/http";
import { Storage } from '@ionic/storage';
import { USER_DATA_KEY, IS_LOGGED_IN_KEY } from "../../app/app.constants";

@Component({
  selector: 'page-channels',
  templateUrl: 'channels.html',
})
export class ChannelsPage {

  followingChannels = [];
  recommendedChannels = [];
  allChannels = [];
  userChannel =[];
  channelAvatar = 'http://the-v.net/Widgets_Site/J-Gallery/Image.ashx?type=channel&id='
  num = 10;
  private descLabel: string = 'md-arrow-dropdown';
  private isDescriptionShown: boolean = false;
  isLoggedOut: Boolean;
  channelType: string = "myChannel";

  constructor(public navCtrl: NavController, public navParams: NavParams, protected popoverCtrl: PopoverController,
    private http: Http, private storage: Storage) {

  }

  ionViewDidEnter() {
    this.checkUserifLoggedIn();
    if(!this.isLoggedOut){
      this.getUserChannel();
      this.getChannelFollowing();
    }
    
    this.getChannelRecommended(this.num.toString());
    this.getChannelAll(this.num.toString());
  }

  presentPopover(myEvent) {
    let popover = this.popoverCtrl.create(PopoverPage);
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
          this.followingChannels = response.json().map(c => {
            c.finalAvatarUrl = this.channelAvatar + c.id;
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
    body.set('count', num);
    body.set('page', '1');

    let options = new RequestOptions({
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    });

    this.http.post('http://cums.the-v.net/site.aspx', body, options)
      .subscribe(response => {
        this.recommendedChannels = response.json().map(c => {
          c.finalAvatarUrl = this.channelAvatar + c.id;
          return c
        })
      }, e => {
        console.log(e);
      }, () => {
      });
  }

  getChannelAll(num) {
    let body = new URLSearchParams();
    body.set('action', 'Channel_GetModerator');
    body.set('count', num);
    body.set('page', '1');

    let options = new RequestOptions({
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    });

    this.http.post('http://cums.the-v.net/site.aspx', body, options)
      .subscribe(response => {
        this.allChannels = response.json().map(c => {
          c.finalAvatarUrl = this.channelAvatar + c.id;
          return c
        })
      }, e => {
        console.log(e);
      }, () => {
      });
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
            c.finalAvatarUrl = 'http://the-v.net/' + c.thumbnail;
            return c
          })
          if (data.length > 0) {
            this.userChannel = data[0];
          } else {
            //do something here if no channel is available
          }
        }, e => {
          console.log(e);
        }, () => {
        });
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
  seeDesc() {
    this.isDescriptionShown = !this.isDescriptionShown;
    this.descLabel = this.isDescriptionShown ? 'md-arrow-dropup' : 'md-arrow-dropdown';
  }
}
