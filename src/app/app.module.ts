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
import { FallbackPage } from "../pages/fallback/fallback";
import { ForgotPasswordPage } from "../pages/forgot-password/forgot-password";

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HomePopoverPage, PlaylistPopoverPage } from "./popover";
import { ScreenOrientation } from "@ionic-native/screen-orientation";
import { IonicStorageModule } from "@ionic/storage";
import { HttpModule } from "@angular/http";
import { FormsModule } from "@angular/forms";
import { SQLite } from "@ionic-native/sqlite";
import { FileTransfer } from '@ionic-native/file-transfer';
import { DownloadService } from "./services/download.service";
import { PlaylistService } from "./services/playlist.service";
import { VideoService } from "./services/video.service";
import { File } from '@ionic-native/file';
import { UserService } from "./services/user.service";
import { ChannelService } from "./services/channel.service";
import { PlayDownloadedVideoPage } from "../pages/play-downloaded-video/play-downloaded-video";

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
    FallbackPage,
    ForgotPasswordPage,
    HomePopoverPage,
    PlayDownloadedVideoPage,
    PlaylistPopoverPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    HttpModule,
    FormsModule
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
    FallbackPage,
    ForgotPasswordPage,
    HomePopoverPage,
    PlayDownloadedVideoPage,
    PlaylistPopoverPage
  ],
  providers: [
    File,
    FileTransfer,
    SQLite,
    StatusBar,
    SplashScreen,
    ScreenOrientation,
    UserService,
    VideoService,
    PlaylistService,
    DownloadService,
    ChannelService,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
