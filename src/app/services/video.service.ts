import { Injectable } from "@angular/core";
import { Http, Headers, Response } from "@angular/http";
import { encodeObject, openSqliteDb } from "../app.utils";
import { VideoDetails, VideoComment } from "../models/video.models";
import { DownloadService } from "./download.service";
import { PlaylistService } from "./playlist.service";
import { Observable } from "rxjs/Observable";
import { UserService } from "./user.service";
import 'rxjs/add/operator/toPromise'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/do'
import { SQLiteObject, SQLite } from "@ionic-native/sqlite";
import { GoogleAnalyticsService } from "./analytics.service";

@Injectable()
export class VideoService {
    private static API_URL = 'http://cums.the-v.net/site.aspx'

    constructor(
        private http: Http,
        private sqlite: SQLite,
        private downloadService: DownloadService,
        private playlistService: PlaylistService,
        private userService: UserService,
        private gaSvc:GoogleAnalyticsService
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

    getLikes(id: string) {
        return this.getDetails(id).then(videoDetails => {
            return videoDetails.mapped.numOfLikes;
        });
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
                            userImageUrl: `http://site.the-v.net/Widgets_Site/avatar.ashx?id=${c.UserId}`
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

    hasBeenLiked(id: string, userId: string) {
        return this.preparePlaylistTable().then(db => {
            return db.executeSql('SELECT * FROM likes WHERE bcid = ? AND memid = ?', [id, userId]);
        }).then(a => {
            if (a.rows.length === 1) {
                return true;
            } else if (a.rows.length === 0) {
                return false;
            } else {
                throw new Error('multiple_entries'); // DUPES!
            }
        });
    }

    addLike(id: string, userId: string) {
        return this.preparePlaylistTable().then(db => {
            return db.executeSql('SELECT * FROM likes WHERE bcid = ? AND memid = ?', [id, userId]);
        }).then(a => {
            if (a.rows.length === 1) {
                // this video has already been liked by the user
                return false;
            } else if (a.rows.length === 0) {
                // this video has not yet been liked by the user
                let headers = new Headers();
                headers.set('Content-Type', 'application/x-www-form-urlencoded');

                return this.http.post(VideoService.API_URL, encodeObject({
                    'action': 'DDrupal_Video_AddLikes',
                    'id': id,
                    'userid': userId
                }), { headers: headers }).map(response => {
                    let data = <any[]>response.json();
                    let isDataEmpty = data.length === 0;

                    let hasError = !isDataEmpty && data[0].Info !== undefined && data[0].Info === 'Error';
                    let isSuccessful = !isDataEmpty && data[0].Data !== undefined && data[0].Data === 'True';

                    return response.ok && !hasError && isSuccessful;
                }).toPromise().then(isSuccessful => {
                    if (isSuccessful) {
                        this.gaSvc.gaEventTracker('Video','Like','Liked a video');
                        return this.preparePlaylistTable().then(db => {
                            return db.executeSql('INSERT INTO likes (bcid, memid) VALUES (?, ?)', [id, userId]);
                        });
                    } else {
                        return isSuccessful;
                    }
                }).then(a => {
                    if (a.rowsAffected === 1) {
                        return true;
                    } else if (a.rowsAffected === 0) {
                        return false;
                    } else {
                        throw new Error('never_gonna_happen');
                    }
                });
            } else {
                throw new Error('multiple_entries'); // DUPES!
            }
        });
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
            switch (data[0].Data) {
                case 'True':{
                    this.gaSvc.gaEventTracker('Video','Comment','Commneted on a video');
                    return true;
                }
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

                imageUrl: `${videoDetail.image}`,
                channelImageUrl: `http://site.the-v.net/Widgets_Site/J-Gallery/Image.ashx?id=${videoDetail.channelId}&type=channel`,
                playerUrl: `http://players.brightcove.net/3745659807001/67a68b89-ec28-4cfd-9082-2c6540089e7e_default/index.html?videoId=${videoDetail.id}`
            }
            return videoDetail;
        });
    }

    private preparePlaylistTable() {
        return openSqliteDb(this.sqlite).then(db => {
            return this.createLikesTable(db);
        })
    }

    private createLikesTable(db: SQLiteObject) {
        return new Promise<SQLiteObject>((resolve, reject) => {
            try {
                db.executeSql(`CREATE TABLE IF NOT EXISTS likes(
                        bcid CHAR(13) NOT NULL,
                        memid CHAR(36) NOT NULL,
                        UNIQUE(bcid, memid))`, {})
                    .then(() => { resolve(db); })
                    .catch(e => { reject(e); })
            } catch (e) {
                reject(e);
            }
        });
    }
}