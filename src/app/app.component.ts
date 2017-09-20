import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, AlertController, Events, ToastController } from 'ionic-angular';
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
import { DownloadService } from "./services/download.service";
import { ConnectionService } from "./services/network.service";
import { Network } from "@ionic-native/network";
import { UploadVideoPage } from "../pages/upload-video/upload-video";

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
  avatar: string = ' ';
  private didLoginHadErrors = false;
  pageState: boolean;
  pages: Array<{ title: string, component: any, icon: string }> = [];

  constructor(public platform: Platform,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen,
    public alertCtrl: AlertController,
    private events: Events,
    private storage: Storage,
    private downloadService: DownloadService,
    private network: Network,
    private toastCtrl: ToastController,
    private connectionSrvc: ConnectionService
  ) {
    this.initializeApp();
    this.updateMenu();
    this.activePage = this.pages[0];

    events.subscribe(AppStateService.UPDATE_MENU_STATE_EVENT, _ => {
      this.updateMenu();
    })
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      if(this.network.type ==="none"){
        let toast = this.toastCtrl.create({
                message: "You're Offline. Check your internet connection.",
                position: 'bottom'
            });
            toast.present();
            this.connectionSrvc.setActiveToast(toast);
      }
      this.connectionSrvc.checkNetworkConnection();
      this.storage.get(USER_DATA_KEY).then(userdata => {
        if (userdata) {
          this.downloadService.removeAllExpiredVideosFor(userdata.id);
        }
      })
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
          { title: 'Upload Video', component: UploadVideoPage, icon: "md-videocam" },
          { title: 'Playlist', component: PlaylistPage, icon: "md-albums" },
          { title: 'Downloads', component: DownloadsPage, icon: "md-download" }
        ];
        this.storage.get(USER_DATA_KEY).then(userDetails => {
          this.username = userDetails.first_name;
          this.email = userDetails.email;
          this.points = userDetails.points;
          this.avatar = 'http://the-v.net/Widgets_Site/avatar.ashx?id=' + userDetails.id;
        })
        this.pageState = isloggedin;
      }
      else {
        this.pages = [
          { title: 'Home', component: HomePage, icon: "md-home" },
          { title: 'Profile', component: FallbackPage, icon: "md-person" },
          { title: 'Channels', component: ChannelsPage, icon: "md-easel" },
          { title: 'Upload Video', component: FallbackPage, icon: "md-videocam" },
          { title: 'Playlist', component: FallbackPage, icon: "md-albums" },
          { title: 'Downloads', component: FallbackPage, icon: "md-download" }
        ];
        this.pageState = isloggedin;
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
          this.storage.set(IS_LOGGED_IN_KEY, false).then(() => {
            return this.storage.set(USER_DATA_KEY, null).then(() => {
              AppStateService.publishAppStateChange(this.events);
              this.nav.setRoot(HomePage);
              this.activePage = "Home";
            })
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
