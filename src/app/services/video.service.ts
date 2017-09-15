import { Injectable } from "@angular/core";
import { Http, Headers, Response } from "@angular/http";
import { encodeObject } from "../app.utils";
import { VideoDetails, VideoComment } from "../models/video.models";
import { DownloadService } from "./download.service";
import { PlaylistService } from "./playlist.service";
import { Observable } from "rxjs/Observable";
import { UserService } from "./user.service";
import 'rxjs/add/operator/toPromise'
import 'rxjs/add/operator/map'

@Injectable()
export class VideoService {
    private static API_URL = 'http://cums.the-v.net/site.aspx'

    constructor(
        private http: Http,
        private downloadService: DownloadService,
        private playlistService: PlaylistService,
        private userService: UserService
    ) { }

    getDetails(id: string) {
        let headers = new Headers()
        headers.set('Content-Type', 'application/x-www-form-urlencoded')

        return this.http.post(VideoService.API_URL, encodeObject({
            'action': 'Video_GetDetails',
            'idorname': id
        }), { headers: headers }).map((response, index) => {
            let videoDetailsArray = <VideoDetails[]>response.json();
            let mapped = this.getMappedVideoDetailsArray(videoDetailsArray);
            return mapped[0];
        }).toPromise<VideoDetails>();
    }

    getRelatedVideos(id: string, count = 5, page = 1) {
        let headers = new Headers()
        headers.set('Content-Type', 'application/x-www-form-urlencoded')

        return this.http.post(VideoService.API_URL, encodeObject({
            'action': 'Video_GetRelated',
            'count': count,
            'id': id,
            'page': page
        }), { headers: headers }).map(response => {
            let videoDetailsArray = <VideoDetails[]>response.json();
            let mapped = this.getMappedVideoDetailsArray(videoDetailsArray);
            return mapped;
        }).toPromise<VideoDetails[]>();
    }

    getComments(id: string) {
        let headers = new Headers()
        headers.set('Content-Type', 'application/x-www-form-urlencoded')

        return this.http.post(VideoService.API_URL, encodeObject({
            'action': 'Comment_GetComment',
            'title': id
        }), { headers: headers }).map(response => {
            return <VideoComment[]>response.json();
        }).toPromise<VideoComment[]>().then(comments => {
            let promises: Promise<VideoComment>[] = [];
            comments.forEach(c => {
                let promise = this.userService.getUserDetails(c.UserId).then(ud => {
                    if (ud) {
                        c.mapped = {
                            userImageUrl: `http://the-v.net${ud.imageUser}`
                        }
                        return c;
                    }
                });
                promises.push(promise);
            })
            return Promise.all(promises)
        })
    }

    isDownloaded(id: string, userId: string) {
        return this.downloadService.isVideoDownloaded(userId, id);
    }

    getInProgressDownload(id: string) {
        return this.downloadService.getInProgressDownloads(id);
    }

    isAddedToPlaylist(id: string, userId: string) {
        return this.playlistService.isVideoAddedToPlaylist(userId, id);
    }

    addLike(id: string, userId: string) {
        let headers = new Headers();
        headers.set('Content-Type', 'application/x-www-form-urlencoded')

        return this.http.post(VideoService.API_URL, encodeObject({
            'action': 'App_Video_AddLikes',
            'id': id,
            'userid': userId
        }), { headers: headers }).map(response => {
            let data = <any[]>response.json();
            let isDataEmpty = data.length > 0;

            let hasError = !isDataEmpty && data[0].Info !== undefined && data[0].Info === 'Error';
            let isSuccessful = !isDataEmpty && data[0].Data !== undefined && data[0].Data === 'True';

            return response.ok && !hasError && isSuccessful;
        })
    }

    addComment(id: string, userId: string, comment: string) {
        let headers = new Headers();
        headers.set('Content-Type', 'application/x-www-form-urlencoded');

        return this.http.post(VideoService.API_URL, encodeObject({
            'action': 'Comment_AddComment',
            'bcid': id,
            'userid': userId,
            'comment': comment,
            'ctype': 'Video'
        }), { headers: headers }).map(response => {
            return response.json();
        }).toPromise().then(data => {
            switch(data[0].Data) {
                case 'True':
                    return true;
                case 'False':
                    return false;
                default:
                    throw new Error('Unknown response value');
            }
        });
    }

    addToPlaylist(id: string, userId: string) {
        return this.playlistService.addVideoFor(userId, id);
    }

    download(id: string, userId: string, userEmail: string) {
        return this.getDetails(id).then(userDetails => {
            return this.downloadService.addVideoFor(userId, userEmail, id, 
                userDetails.title, userDetails.channelName, userDetails.time,
                userDetails.mapped.imageUrl);
        });
    }

    private getMappedVideoDetailsArray(videoDetailsArray: VideoDetails[]) {
        return videoDetailsArray.map(videoDetail => {
            videoDetail.mapped = {
                tags: videoDetail.tags.split(',').map(t => t.trim()),
                availableLanguages: videoDetail.tags.split(',').map(t => t.trim()),

                numOfViews: parseInt(videoDetail.views),
                numOfPlays: parseInt(videoDetail.plays),
                numOfPoints: parseInt(videoDetail.points),
                numOfLikes: parseInt(videoDetail.likes),
                numOfComments: parseInt(videoDetail.comments),

                isApproved: videoDetail.isapproved.toLowerCase() === 'true',
                isRecommended: videoDetail.is_recommended.toLowerCase() === 'true',
                isHighlighted: videoDetail.isHighlighted.toLowerCase() === 'true',
                isDownloadable: videoDetail.videoDl.toLowerCase() !== 'locked',
                canBeAccessedAnonymously: videoDetail.videoPrivacy.toLowerCase() === 'public',

                imageUrl: `http://the-v.net${videoDetail.image}`,
                channelImageUrl: `http://the-v.net/Widgets_Site/J-Gallery/Image.ashx?id=${videoDetail.channelId}&type=channel`,
                playerUrl: `http://players.brightcove.net/3745659807001/67a68b89-ec28-4cfd-9082-2c6540089e7e_default/index.html?videoId=${videoDetail.id}`
            }
            return videoDetail;
        });
    }
}