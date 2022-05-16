import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs-compat";

@Injectable({
    providedIn: 'root'
})
export class AutoPassObjectService { 

    private autoPassPauseEnableStateSource = new BehaviorSubject(false);
    currentAutoPassStateValue = this.autoPassPauseEnableStateSource.asObservable();

    constructor() {}
    onAutoPassToggle(value){
        this.autoPassPauseEnableStateSource.next(value);
    }

    getCurrentToolTipMessage(){
        let toolTipMsg = "Click to enable Autopass ";
        if(this.autoPassPauseEnableStateSource.value){
            toolTipMsg = "Click to disable Autopass";
        }
        return toolTipMsg;
    }

    getCurrentConfirmMessage(){
        

        let confirmMessage = "Are you sure you want to enable Autopass ";
        if(this.autoPassPauseEnableStateSource.value){
            confirmMessage = "Are you sure you want to disable Autopass";
        }
        return confirmMessage;
    }

    getCurrentValue(){
        return this.autoPassPauseEnableStateSource.value;
    }

}