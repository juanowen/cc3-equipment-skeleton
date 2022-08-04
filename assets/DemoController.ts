import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

import { EquipmentSkeleton } from './scripts/EquipmentSkeleton';
import { EquipmentSet } from './scripts/EquipmentSet';

@ccclass('DemoController')
export class DemoController extends Component {
    private _equipmentSkeleton: EquipmentSkeleton = null;
    private _lookIndex: number = 0;

    start() {
        this._equipmentSkeleton = this.getComponent(EquipmentSkeleton);
        if (this._equipmentSkeleton) {
            this.schedule(() => {
                this._changeLook();
            }, 2);
        }
    }

    _changeLook() {
        this._equipmentSkeleton.onEquipmentTakeOff();

        const keys = Object.keys(EquipmentSet);
        const equipmentSet = EquipmentSet[keys[this._lookIndex]];
        if (equipmentSet !== EquipmentSet.None) {
            this._equipmentSkeleton.onEquipmentWearSet(equipmentSet, this._equipmentSkeleton.id);
        }

        this._lookIndex = (this._lookIndex + 1) % keys.length;
    }
}

