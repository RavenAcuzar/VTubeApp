import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { ChannelsPage } from "../pages/channels/channels";
import { ChannelPrevPage } from "../pages/channel-prev/channel-prev";
import { DownloadsPage } from "../pages/downloads/downloads";
import { LoginPage } from "../pages/login/login";
import { NowPlayingPage } from "../pages/now-playing/now-playing";
import { PlaylistPage } from "../pages/playlist/playlist";
import { ProfilePage } from "../pages/profile/profile";
import { SearchPage } from "../pages/search/search";

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { PopoverPage } from "./popover";
import { ScreenOrientation } from "@ionic-native/screen-orientation";



@NgModule({
  declarations: [
    MyApp,
    HomePage,
    ChannelsPage,
    ChannelPrevPage,
    DownloadsPage,
    LoginPage,
    NowPlayingPage,
    PlaylistPage,
    ProfilePage,
    SearchPage,
    PopoverPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    ChannelsPage,
    ChannelPrevPage,
    DownloadsPage,
    LoginPage,
    NowPlayingPage,
    PlaylistPage,
    ProfilePage,
    SearchPage,
    PopoverPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    ScreenOrientation,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
