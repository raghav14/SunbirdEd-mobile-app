import { Injectable, Inject } from '@angular/core';
import { PlayerService, InteractType, Content } from 'sunbird-sdk';
import { CanvasPlayerService } from '@app/services/canvas-player.service';
import { AppGlobalService } from '@app/services/app-global-service.service';
import { File } from '@ionic-native/file/ngx';
import { InteractSubtype, Environment, PageId } from '@app/services/telemetry-constants';
import { TelemetryGeneratorService } from '@app/services/telemetry-generator.service';
import { ContentInfo } from '../content-info';
import { RouterLinks } from '@app/app/app.constant';
import { Router } from '@angular/router';


@Injectable({
    providedIn: 'root'
})
export class ContentPlayerHandler {
    constructor(
        @Inject('PLAYER_SERVICE') private playerService: PlayerService,
        private canvasPlayerService: CanvasPlayerService,
        private file: File,
        private telemetryGeneratorService: TelemetryGeneratorService,
        private router: Router
    ) { }

    /**
     * Launches Content-Player with given configuration
     */
    public launchContentPlayer(content: Content, isStreaming: boolean, shouldDownloadnPlay: boolean, contentInfo: ContentInfo) {
        if (!AppGlobalService.isPlayerLaunched) {
            AppGlobalService.isPlayerLaunched = true;
        }
        const values = new Map();
        values['autoAfterDownload'] = shouldDownloadnPlay;
        values['isStreaming'] = isStreaming;
        this.telemetryGeneratorService.generateInteractTelemetry(InteractType.TOUCH,
            InteractSubtype.CONTENT_PLAY,
            Environment.HOME,
            PageId.CONTENT_DETAIL,
            contentInfo.telemetryObject,
            values,
            contentInfo.rollUp,
            contentInfo.correlationList);

        if (isStreaming) {
            const extraInfoMap = { hierarchyInfo: [] };
            extraInfoMap.hierarchyInfo = contentInfo.hierachyInfo;
        }
        const request: any = {};
        if (isStreaming) {
            request.streaming = isStreaming;
        }
        request['correlationData'] = contentInfo.correlationList;
        this.playerService.getPlayerConfig(content, request).subscribe((data) => {
            data['data'] = {};
            if (data.metadata.mimeType === 'application/vnd.ekstep.ecml-archive') {
                if (!isStreaming) {
                    this.file.checkFile(`file://${data.metadata.basePath}/`, 'index.ecml').then((isAvailable) => {
                        this.canvasPlayerService.xmlToJSon(`${data.metadata.basePath}/index.ecml`).then((json) => {
                            data['data'] = json;
                            // Migration Todo
                            // this.app.getActiveNavs()[0].push(PlayerPage, { config: data });
                            this.router.navigate([RouterLinks.PLAYER], { state: { config: data } });

                        }).catch((error) => {
                            console.error('error1', error);
                        });
                    }).catch((err) => {
                        console.error('err', err);
                        this.canvasPlayerService.readJSON(`${data.metadata.basePath}/index.json`).then((json) => {
                            data['data'] = json;
                            //this.app.getActiveNavs()[0].push(PlayerPage, { config: data });
                            this.router.navigate([RouterLinks.PLAYER], { state: { config: data } });

                        }).catch((e) => {
                            console.error('readJSON error', e);
                        });
                    });
                } else {
                    // this.app.getActiveNavs()[0].push(PlayerPage, { config: data });
                    this.router.navigate([RouterLinks.PLAYER], { state: { config: data } });
                }

            } else {
                // this.app.getActiveNavs()[0].push(PlayerPage, { config: data });
                this.router.navigate([RouterLinks.PLAYER], { state: { config: data } });
            }
        });
    }
}
