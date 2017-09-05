import { Component } from '@angular/core';
import { NavController, PopoverController, InfiniteScroll } from 'ionic-angular';
import { PopoverPage } from "../../app/popover";
import { NowPlayingPage } from "../now-playing/now-playing";
import { SearchPage } from "../search/search";
import { FallbackPage } from "../fallback/fallback";
import { Http, RequestOptions, Headers, URLSearchParams } from "@angular/http";



@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  freeVids = [];
  premiumVids = [];
  channelDetail;
  numvids = 10;

  vidType: string = "freeVid";
  constructor(public navCtrl: NavController, protected popoverCtrl: PopoverController,
    public http: Http) {
    this.getFreeVids(this.numvids.toString());
    this.getPremVids(this.numvids.toString());
  }
  presentPopover(myEvent) {
    let popover = this.popoverCtrl.create(PopoverPage);
    popover.present({
      ev: myEvent
    });
  }

  loadMoreFree(infiniteScroll: InfiniteScroll) {
    this.numvids+=10;
    this.getFreeVids(this.numvids.toString(), () => {
      infiniteScroll.complete();
    });
  }
  loadMorePrem(infiniteScroll: InfiniteScroll) {
    this.numvids+=10;
    this.getPremVids(this.numvids.toString(), () => {
      infiniteScroll.complete();
    });
  }

  getPremVids(num, callback?) {
    let body = new URLSearchParams();
    body.set('action', 'Video_GetByLevel');
    body.set('count', num);
    body.set('level', 'Intermediate');
    body.set('page', '1');

    let options = new RequestOptions({
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    });

    this.http.post('http://cums.the-v.net/site.aspx', body, options)
      .subscribe(response => {
        this.premiumVids = response.json();
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
    body.set('count', num);
    body.set('level', 'Beginner');
    body.set('page', '1');

    let options = new RequestOptions({
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    });

    this.http.post('http://cums.the-v.net/site.aspx', body, options)
      .subscribe(response => {
        this.freeVids = response.json().filter((v)=>{
          return v.videoPrivacy === 'public';
        });
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
    fv.channelImage= null;

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
        fv.channelImage = 'http://the-v.net/Widgets_Site/J-Gallery/Image.ashx?type=channel&id=' + channelDetail[0].channelUrl;
      }, e => {
        console.log(e);
      }, () => {
      });
  }


  playVideo(id: string) {
    this.navCtrl.push(NowPlayingPage);
  }
  searchThing() {
    this.navCtrl.push(SearchPage);
  }
  goToFallback() {
    this.navCtrl.push(FallbackPage);
  }
}


