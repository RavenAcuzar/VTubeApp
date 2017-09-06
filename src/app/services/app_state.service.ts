import { Events } from "ionic-angular";
import { MyApp } from "../app.component";

export class AppStateService {
    public static readonly UPDATE_MENU_STATE_EVENT = 'update_menu_state';

    public static publishAppStateChange(events: Events) {
        events.publish(AppStateService.UPDATE_MENU_STATE_EVENT);
    }
}