import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ChannelPrevPage } from './channel-prev';

@NgModule({
  declarations: [
    ChannelPrevPage,
  ],
  imports: [
    IonicPageModule.forChild(ChannelPrevPage),
  ],
})
export class ChannelPrevPageModule {}
