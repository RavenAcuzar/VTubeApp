import { Component } from "@angular/core";
import { ViewController } from "ionic-angular";

@Component({
  template: `
    <ion-list class="popover-page">
      <button ion-item (click)="close()">Add to Playlist</button>
       <button ion-item (click)="close()">Download</button>
    </ion-list>
  `
})
export class PopoverPage {
  constructor(public viewCtrl: ViewController) {}

  close() {
    //do add to playlist code here//
    this.viewCtrl.dismiss();
  }
}