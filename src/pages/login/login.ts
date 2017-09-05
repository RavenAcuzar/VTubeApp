import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { ForgotPasswordPage } from "../forgot-password/forgot-password";
import { Http, Headers, URLSearchParams } from "@angular/http";
import { Storage } from '@ionic/storage';
import { IS_LOGGED_IN_KEY } from "../../app/app.constants";

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {
  private isCredentialsIncorrect = false;
  private didLoginHadErrors = false;

  private loginForm: {
    email: string,
    password: string
  } = {
    email: '',
    password: ''
  }

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private http: Http,
    private storage: Storage,
    private loadingController: LoadingController
  ) { }

  login() {
    this.isCredentialsIncorrect = false;
    this.didLoginHadErrors = false;

    let encodedString = 'action=' + encodeURIComponent("checkloginMob") +
      '&email=' + encodeURIComponent(this.loginForm.email) +
      '&password=' + encodeURIComponent(this.loginForm.password);

    let headers = new Headers()
    headers.set('Content-Type', 'application/x-www-form-urlencoded')
    
    let errCallback = e => {
      this.didLoginHadErrors = true;
    };

    this.http.post('http://cums.the-v.net/site.aspx', encodedString, {
      headers: headers
    }).subscribe(response => {
      let userArray = response.json()
      this.isCredentialsIncorrect = userArray.length <= 0;

      if (!this.isCredentialsIncorrect) {
        this.storage.set(IS_LOGGED_IN_KEY, true).catch(errCallback)
      }
    }, errCallback)
  }

  forgotPass() {
    this.navCtrl.push(ForgotPasswordPage);
  }
}
