import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, AlertController, Events, ToastController, NavController } from 'ionic-angular';
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
import { VoltChatPage } from "../pages/volt-chat/volt-chat";
import { UploadVideoPage } from "../pages/upload-video/upload-video";
import { NowPlayingPage } from "../pages/now-playing/now-playing";
import { Deeplinks } from '@ionic-native/deeplinks';
import { Push, PushObject, PushOptions } from '@ionic-native/push';

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
    private connectionSrvc: ConnectionService,
    private deeplinks: Deeplinks,
    public push: Push
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
      this.deeplinks.routeWithNavController(this.nav, {
        '/vid/:id': NowPlayingPage
      }).subscribe((match) => {
        console.log('Successfully matched route', match);
      }, (nomatch) => {
        console.error('Got a deeplink that didn\'t match', nomatch);
      });
      if (this.network.type === "none") {
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
      this.pushsetup();
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
          { title: 'Downloads', component: DownloadsPage, icon: "md-download" },
          { title: 'Chat with Volt', component: VoltChatPage, icon: "ios-text" }
        ];
        this.storage.get(USER_DATA_KEY).then(userDetails => {
          this.username = userDetails.first_name;
          this.email = userDetails.email;
          this.points = userDetails.points;
          this.avatar = 'http://site.the-v.net/Widgets_Site/avatar.ashx?id=' + userDetails.id;
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
          { title: 'Downloads', component: FallbackPage, icon: "md-download" },
          { title: 'Chat with Volt', component: FallbackPage, icon: "ios-text" }
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
  pushsetup() {
    const options: PushOptions = {
      android: {
        senderID: '597577788490',
        topics: ["VTUBE_ALL_USERS"]
      },
      ios: {
        alert: 'true',
        badge: true,
        sound: 'false',
        topics: ['VTUBE_ALL_USERS']
      }
    };

    const pushObject: PushObject = this.push.init(options);

    pushObject.on('notification').subscribe((data: any) => {
      if (!data.additionalData.coldstart) {
        if (data.additionalData.dataid) {
          let youralert = this.alertCtrl.create({
            title: data.title,
            message: data.message,
            buttons: [
              {
                text: 'Cancel',
                role: 'cancel',
                handler: () => {
                  console.log('Cancel clicked');
                }
              },
              {
                text: 'View',
                handler: () => {
                  this.nav.push(NowPlayingPage, {
                    id: data.additionalData.dataid
                  });
                }
              }
            ]
          });
          youralert.present();
        }
        else {
          let youralert = this.alertCtrl.create({
            title: data.title,
            message: data.message,
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
      }
      else {
        if (data.additionalData.dataid) {
          this.nav.push(NowPlayingPage, {
            id: data.additionalData.dataid
          });
        }
      }


    });

    pushObject.on('registration').subscribe((registration: any) => {
      console.log(registration);
    });

    pushObject.on('error').subscribe(error => alert('Error with Push plugin' + error));
  }

}
