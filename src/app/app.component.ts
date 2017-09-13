import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, AlertController, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { ProfilePage } from "../pages/profile/profile";
import { ChannelsPage } from "../pages/channels/channels";
import { PlaylistPage } from "../pages/playlist/playlist";
import { DownloadsPage } from "../pages/downloads/downloads";
import { LoginPage } from "../pages/login/login";
import { FallbackPage } from "../pages/fallback/fallback";
import { Storage } from '@ionic/storage';
import { IS_LOGGED_IN_KEY, USER_DATA_KEY } from "./app.constants";
import { AppStateService } from "./services/app_state.service";

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = HomePage;
  activePage: any;
  username: string = ' ';
  email: string = ' ';
  points: string = '0';
  avatar: string= ' ';
  private didLoginHadErrors = false;
  pageState: boolean;
  pages: Array<{ title: string, component: any, icon: string }> = [];

  constructor(public platform: Platform,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen,
    public alertCtrl: AlertController,
    private events: Events,
    private storage: Storage
  ) {
    this.initializeApp();
    this.updateMenu();
    events.subscribe(AppStateService.UPDATE_MENU_STATE_EVENT,_=>{
        this.updateMenu();
      })
    this.activePage = this.pages[0];
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    if (page.component == FallbackPage) {
      this.nav.push(page.component);
    }
    else {
      this.nav.setRoot(page.component);
      this.activePage = page;
    }
  }

  updateMenu() {
    this.didLoginHadErrors = false;
    let errCallback = e => {
      this.didLoginHadErrors = true;
    };
    this.storage.get(IS_LOGGED_IN_KEY).then(isloggedin => {
      if (isloggedin) {
        this.pages = [
          { title: 'Home', component: HomePage, icon: "md-home" },
          { title: 'Profile', component: ProfilePage, icon: "md-person" },
          { title: 'Channels', component: ChannelsPage, icon: "md-easel" },
          { title: 'Playlist', component: PlaylistPage, icon: "md-albums" },
          { title: 'Downloads', component: DownloadsPage, icon: "md-download" }
        ];
        this.storage.get(USER_DATA_KEY).then(userDetails =>{
          this.username=userDetails.first_name;
          this.email=userDetails.email;
          this.points=userDetails.points;
          this.avatar= 'http://the-v.net/Widgets_Site/avatar.ashx?id='+userDetails.id;
        })
        this.pageState=isloggedin;
      }
      else {
        this.pages = [
          { title: 'Home', component: HomePage, icon: "md-home" },
          { title: 'Profile', component: FallbackPage, icon: "md-person" },
          { title: 'Channels', component: ChannelsPage, icon: "md-easel" },
          { title: 'Playlist', component: FallbackPage, icon: "md-albums" },
          { title: 'Downloads', component: FallbackPage, icon: "md-download" }
        ];
        this.pageState=isloggedin;
      }
    }).catch(errCallback);
  }

  logoutAlert() {

    let errCallback = e => {
      this.didLoginHadErrors = true;
    };
    let alert = this.alertCtrl.create({
      title: 'Are you sure you want to Log out?',
      buttons: [{
        text: 'Logout',
        handler: () => {
          console.log('Logout clicked');
          this.storage.set(IS_LOGGED_IN_KEY, false).then(()=>{
            AppStateService.publishAppStateChange(this.events);
            this.nav.setRoot(HomePage);
            this.activePage = "Home";
          }).catch(errCallback);
          
          alert.dismiss();
          return false;
        }
      },
      {
        text: 'Cancel',
        handler: () => {
          console.log('Cancel clicked');
          alert.dismiss();
          return false;
        }
      }
      ]
    })
    alert.present();
  }


  login() {
    this.nav.push(LoginPage);
  }
  checkActive(page) {
    return page == this.activePage;
  }


}
