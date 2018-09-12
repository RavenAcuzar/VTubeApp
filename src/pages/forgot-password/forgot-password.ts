import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Http, RequestOptions, Headers, URLSearchParams } from "@angular/http";
import { GoogleAnalyticsService } from '../../app/services/analytics.service';

/**
 * Generated class for the ForgotPasswordPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@Component({
  selector: 'page-forgot-password',
  templateUrl: 'forgot-password.html',
})
export class ForgotPasswordPage {
  private inputEmail: string;
  private message;
  private hideMessage = true;
  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private http: Http,
    private gaSvc:GoogleAnalyticsService) {
      this.gaSvc.gaTrackPageEnter('Forgot Password');
  }
  sendResetEmail() {
    let body = new URLSearchParams();
    body.set('action', 'forgotpassword_site');
    body.set('email', this.inputEmail);

    let options = new RequestOptions({
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    });

    this.http.post('http://cums.the-v.net/site.aspx', body, options)
      .subscribe(response => {
        this.hideMessage = false;
        let data = response.json();
        this.message = data[0].Data;
      })
      , e => {
        console.log(e);
      }, () => {
      };
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ForgotPasswordPage');
  }

}
