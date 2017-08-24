import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, AlertController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { ProfilePage } from "../pages/profile/profile";
import { ChannelsPage } from "../pages/channels/channels";
import { PlaylistPage } from "../pages/playlist/playlist";
import { DownloadsPage } from "../pages/downloads/downloads";
import { LoginPage } from "../pages/login/login";


@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = HomePage;
  activePage:any;
  pages: Array<{title: string, component: any, icon: string}>;

  constructor(public platform: Platform, public statusBar: StatusBar, public splashScreen: SplashScreen, public alertCtrl: AlertController) {
    this.initializeApp();

    // used for an example of ngFor and navigation
    this.pages = [
      { title: 'Home', component: HomePage, icon: "md-home" },
      { title: 'Profile', component: ProfilePage, icon: "md-person" },
      { title: 'Channels', component: ChannelsPage, icon: "md-easel" },
      { title: 'Playlist', component: PlaylistPage, icon: "md-albums" },
      { title: 'Downloads', component: DownloadsPage, icon: "md-download" },
      { title: 'Logout', component: LoginPage, icon: "md-log-out" }
      
    ];
    this.activePage=this.pages[0];
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
    this.nav.setRoot(page.component);
    this.activePage=page;
  }

  logoutAlert(){
    let alert = this.alertCtrl.create({
      title: "You're about to logout...",
      message: 'Are you sure you want to Logout?',
      buttons: [{
         text: 'Cancel',
        role: 'cancel',
        handler: () => {
          console.log('Cancel clicked');
          alert.dismiss();
        }
      },
      {
         text: 'Logout',
        handler: () => {
          console.log('Logout clicked');
          alert.dismiss();
        }
      },
    ]
    })
   alert.present();
  }

  checkActive(page){
    return page==this.activePage;
  }
}
