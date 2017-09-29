import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Http, Headers, RequestOptions, URLSearchParams } from "@angular/http";
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import { File, FileEntry } from '@ionic-native/file';
import { Storage } from '@ionic/storage';
import { USER_DATA_KEY, UPLOAD_DETAILS } from "../app.constants";
import { Subject } from "rxjs/Subject";

export type VideoUploadDetails = {
    source: string,
    title: string,
    description: string,
    tags: string,
    category: string,
    level: string,
    targetMarketLoc: string,
    allowComment: string,
    allowSharing: string,
    privacy: string,
    filename?: string
};

@Injectable()
export class UploadService {
    public static readonly NOT_UPLOADING = 0;
    public static readonly PREPARING_VIDEO_UPLOAD = 1;
    public static readonly SAVING_VIDEO_DETAILS = 2;
    public static readonly STARTING_VIDEO_UPLOAD = 3;
    public static readonly VIDEO_UPLOADING = 4;
    public static readonly SENDING_VIDEO_DETAILS = 5;
    public static readonly FINISHED_VIDEO_UPLOAD = 6;

    public static readonly ERROR_UPLOAD_CANCELLED = -1;
    public static readonly ERROR_DURING_DETAILS_SAVE = -2;
    public static readonly ERROR_DURING_UPLOAD = -3;
    public static readonly ERROR_DURING_DETAILS_SEND = -4;

    private uploadStatus = UploadService.NOT_UPLOADING;
    private currentUploadObservable: Subject<number>;
    private currentUploadStatusObservable: Subject<number>;
    private fileTransferObject: FileTransferObject;

    constructor(
        private file: File,
        private storage: Storage,
        private http: Http,
        private fileTransfer: FileTransfer
    ) {
        this.currentUploadStatusObservable = new Subject<number>();
    }

    getCurrentUploadStatus() {
        return this.uploadStatus;
    }

    isAnUploadInProgress() {
        return this.currentUploadStatusObservable != null
            && this.currentUploadObservable != null
            && this.uploadStatus > 0;
    }

    getCurrentUploadStatusObservable() {
        return this.currentUploadStatusObservable;
    }

    getInProgressUploadObservable() {
        return this.currentUploadObservable;
    }

    uploadVideo(details: VideoUploadDetails) {
        this.currentUploadStatusObservable.next(UploadService.PREPARING_VIDEO_UPLOAD);

        let lastIndexOfSlash = details.source.lastIndexOf('/');
        let fileName = details.source.substring(lastIndexOfSlash + 1);
        let guid = Math.round(new Date().getTime() + (Math.random() * 100));

        this.currentUploadStatusObservable.next(UploadService.SAVING_VIDEO_DETAILS);

        return this.saveVideoDetailsToStorage(details).then(_ => {
            this.currentUploadStatusObservable.next(UploadService.STARTING_VIDEO_UPLOAD);
            return this.sendVideoToServer(`${guid}`, details.source);
        }).then(observable => {
            this.currentUploadStatusObservable.next(UploadService.VIDEO_UPLOADING);
            return observable;
        });
    }

    cancelUpload(){
        if (this.fileTransferObject) {
            this.fileTransferObject.abort();
        }
    }

    private sendVideoToServer(guid: string, vidSrc: string): Promise<Subject<number>> {
        if (this.isAnUploadInProgress()) {
            return Promise.reject(new Error('upload_in_progress'));
        }

        let uri = encodeURI('http://cums.the-v.net/Vtube.aspx');
        let lastIndexOfSlash = vidSrc.lastIndexOf('/');
        let fileName = vidSrc.substring(lastIndexOfSlash + 1);
        let fileContainingDirectory = vidSrc.substring(0, lastIndexOfSlash);

        return this.file.resolveDirectoryUrl(fileContainingDirectory).then(vid => {
            return this.file.getFile(vid, fileName, {});
        }).then(file => {
            return new Promise<string>((resolve, reject) => {
                // it becomes null when platform is ios
                file.file(
                    file => resolve(file.type == null ? 'video/*' : file.type),
                    err => resolve('video/*'));
            });
        }).then(mimetype => {
            return this.storage.get(USER_DATA_KEY).then(userDetails => {
                let options = {
                    fileKey: 'UploadedFile',
                    fileName: fileName,
                    mimeType: mimetype,
                    params: {
                        type: 'video',
                        userid: userDetails.id,
                        action: 'VideoCreate',
                        guid: guid.toString()
                    },
                }

                this.currentUploadObservable = new Subject<number>();
                let observable = this.currentUploadObservable;

                let errorOccured = (error) => {
                    observable.error(error);
                    this.currentUploadObservable = null;
                };

                this.fileTransferObject = this.fileTransfer.create();
                this.fileTransferObject.onProgress(e => {
                    let progress = (e.lengthComputable) ? Math.floor(e.loaded / e.total * 100) : -1;
                    observable.next(progress);
                });
                this.fileTransferObject.upload(vidSrc, uri, options).then(r => {
                    this.getVideoDetailsFromStorage().then(details => {
                        this.currentUploadStatusObservable.next(UploadService.SENDING_VIDEO_DETAILS);
                        return this.sendVideoDetailsToServer(details);
                    }).then(response => {
                        observable.complete();
                        this.currentUploadObservable = null;
                        this.currentUploadStatusObservable.next(UploadService.FINISHED_VIDEO_UPLOAD);
                    }).catch(error => {
                        this.currentUploadStatusObservable.next(UploadService.ERROR_DURING_DETAILS_SEND);
                        errorOccured(error);
                    });
                }, error => {
                    // TODO: handle cancelled video upload
                    this.currentUploadStatusObservable.next(UploadService.ERROR_DURING_UPLOAD);
                    errorOccured(error);
                }).catch(error => {
                    this.currentUploadStatusObservable.next(UploadService.ERROR_DURING_UPLOAD);
                    errorOccured(error);
                });

                return observable;
            });
        });
    }

    private getVideoDetailsFromStorage() {
        return this.storage.get(UPLOAD_DETAILS).then(details => <VideoUploadDetails>details);
    }

    private saveVideoDetailsToStorage(details: VideoUploadDetails) {
        return this.storage.set(UPLOAD_DETAILS, details).then(_ => details);
    }

    private sendVideoDetailsToServer(details: VideoUploadDetails) {
        let body = new URLSearchParams();
        body.set('action', 'Drupal_Video_Create');
        body.set('name', details.title);
        body.set('desc', details.description);
        body.set('tags', details.tags);
        body.set('category', details.category);
        body.set('level', details.level);
        body.set('targetMarketLocations', details.targetMarketLoc.toString());
        body.set('comment', details.allowComment);
        body.set('share', details.allowSharing);
        body.set('publish', details.privacy);
        body.set('filename', details.filename);

        let options = new RequestOptions({
            headers: new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' })
        });

        return this.http.post('http://cums.the-v.net/site.aspx', body, options)
            .map(r => r.json()).toPromise();
    }
}