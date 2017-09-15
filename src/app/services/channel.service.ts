import { Injectable } from "@angular/core";
import { Http, Headers } from "@angular/http";
import { encodeObject } from "../app.utils";
import { ChannelDetails } from "../models/channel.models";

@Injectable()
export class ChannelService {
    private static API_URL = 'http://cums.the-v.net/site.aspx'

    constructor(
        private http: Http
    ) { }

    getDetailsOf(id: string) {
        let headers = new Headers();
        headers.set('Content-Type', 'application/x-www-form-urlencoded')

        return this.http.post(ChannelService.API_URL, encodeObject({
            'action': 'Channel_GetDetails',
            'id': id
        }), { headers: headers }).map(response => {
            let chs = <ChannelDetails[]>response.json();
            if (chs.length > 0) {
                return chs[0];
            } else {
                return null;
            }
        }).toPromise();
    }

    follow(id: string, by: string) {
        let headers = new Headers();
        headers.set('Content-Type', 'application/x-www-form-urlencoded')

        return this.http.post(ChannelService.API_URL, encodeObject({
            'action': 'DDrupal_Channel_FollowChannel',
            'id': id,
            'userid': by
        }), { headers: headers }).toPromise().then(response => {
            let data = response.json();
            return data.length > 0 && data[0] && data[0].Data && data[0].Data === 'True';
        });
    }

    unfollow(id: string, by: string) {
        let headers = new Headers();
        headers.set('Content-Type', 'application/x-www-form-urlencoded')

        return this.http.post(ChannelService.API_URL, encodeObject({
            'action': 'DDrupal_Channel_UnfollowChannel',
            'id': id,
            'userid': by
        }), { headers: headers }).toPromise().then(response => {
            let data = response.json();
            return data.length > 0 && data[0] && data[0].Data && data[0].Data === 'True';
        });
    }

    isFollowing(channelId: string, by: string) {
        let headers = new Headers();
        headers.set('Content-Type', 'application/x-www-form-urlencoded')

        return this.http.post(ChannelService.API_URL, encodeObject({
            'action': 'App_UserFollowing',
            'id': by
        }), { headers: headers })
            .map(response => response.json()
                .map(c => c.channelId))
            .toPromise()
            .then((channelIds: string[]) => {
                return channelIds.some(cid => cid === channelId);
            })
    }
}