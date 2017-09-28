import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Http, Headers, RequestOptions, URLSearchParams } from "@angular/http";
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import { File, FileEntry } from '@ionic-native/file';
import { Storage } from '@ionic/storage';
import { USER_DATA_KEY, UPLOAD_DETAILS } from "../app.constants";

@Injectable()
export class UploadService {

    constructor(private file: File,
        private storage: Storage,
        private http: Http) {
    }
    uploadVideo(vidsrc, title, description, tags, category, level, targetMarketLoc, allowComment, allowSharing, privacy) {
        this.saveInfoToStoraage(vidsrc, title, description, tags, category, level, targetMarketLoc, allowComment, allowSharing, privacy)
        let guid = Math.round(new Date().getTime() + (Math.random() * 100));
        this.sendVidToServer(guid, vidsrc);
        let tmark = targetMarketLoc.toString();
        let body = new URLSearchParams();
        body.set('action', 'Drupal_Video_Create');
        body.set('name', title);
        body.set('desc', description);
        body.set('tags', tags);
        body.set('category', category);
        body.set('level', level);
        body.set('targetMarketLocations', tmark);
        body.set('comment', allowComment);
        body.set('share', allowSharing);
        body.set('publish', privacy);
        body.set('filename', guid.toString());

        let options = new RequestOptions({
            headers: new Headers({
                'Content-Type': 'application/x-www-form-urlencoded'
            })
        });

        this.http.post('http://cums.the-v.net/site.aspx', body, options)
            .subscribe(response => {
                console.log(response);
            })
    }

    private sendVidToServer(guid, vidSrc) {
        let uri = encodeURI('http://cums.the-v.net/Vtube.aspx')

        this.file.resolveDirectoryUrl(vidSrc.substring(0, vidSrc.lastIndexOf('/'))).then(vid => {
            return this.file.getFile(vid, vidSrc.substr(vidSrc.lastIndexOf('/') + 1), {})
        }).then(file => {
            let d = (mimetype) => {
                this.storage.get(USER_DATA_KEY).then(userDetails => {
                    let id = userDetails.id;
                    let options = {
                        fileKey: 'UploadedFile',
                        fileName: vidSrc.substr(vidSrc.lastIndexOf('/') + 1),
                        httpMethod: 'POST',
                        mimeType: mimetype,
                        params: {
                            type: 'video',
                            userid: id,
                            action: 'VideoCreate',
                            guid: guid.toString()
                        },
                    }
                    let fileTransfer = new FileTransferObject()
                    fileTransfer.onProgress((e) => {
                        console.log("Uploaded " + e.loaded + " of " + e.total);
                    })
                    fileTransfer.upload(vidSrc, uri, options)
                        .then((r) => {
                            console.log(r);
                        }, (error) => {
                            console.log(error);
                        }).catch((error) => {
                            console.log(error);
                        })
                })
            }
            file.file(file => {
                d(file.type == null ? 'video/*' : file.type);
            }, err => {
                d('video/*');
            })
        })
    }
    private saveInfoToStoraage(vidsrc, title, description, tags, category, level, targetMarketLoc, allowComment, allowSharing, privacy){
        this.storage.set(UPLOAD_DETAILS, {
            vidsrc: vidsrc,
            title: title,
            description: description,
            tags: tags,
            category: category,
            level: level,
            targetMarketLoc: targetMarketLoc,
            allowComment:allowComment,
            allowSharing: allowSharing,
            privacy: privacy
        })
    }

}