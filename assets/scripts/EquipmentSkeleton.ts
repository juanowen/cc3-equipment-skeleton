
import { 
    _decorator, sp,
    Layers, Node, SpriteFrame, Color, 
    Enum, Size, Vec2, Vec3, Mat4 
} from 'cc';
import { EDITOR } from "cc/env";
import { EquipmentType } from './EquipmentType';
import { EquipmentSet } from './EquipmentSet';
import { EquipmentSlot } from './EquipmentSlot';

const { ccclass, property, executeInEditMode, type } = _decorator;

@ccclass('EquipmentNodeSpritePair')
class EquipmentNodeSpritePair {
    @property
    public _slot: EquipmentSlot = null;
    @property({ 
        displayName: 'Slot',
        tooltip: 'слот', 
        type: EquipmentSlot })
    get slot() {
        return this._slot;
    }
    @property({
        type: SpriteFrame,
        tooltip: 'спрайт'
    })
    public spriteFrame: SpriteFrame = null;
    @property({
        tooltip: 'использовать оттенок манекена для данного спрайта'
    })
    public useTint = false;
    @property({
        tooltip: 'растягивать спрайт по размерам данного слота'
    })
    public useSlotSize = false;

    setSlot(slot: EquipmentSlot) {
        this._slot = slot;
    }
}

@ccclass('EquipmentSetHelper')
class EquipmentSetHelper {
    constructor(equipmentSkeleton: EquipmentSkeleton) {
        this._equipmentSkeleton = equipmentSkeleton;
    }

    @property
    private _equipmentSkeleton: EquipmentSkeleton = null;

    @property
    private _type: EquipmentType = EquipmentType.None;
    @property({
        type: Enum(EquipmentType),
        tooltip: 'тип предмета одежды данного костюма'
    })
    get type() {
        return this._type;
    }
    set type(value) {
        this._type = value;
        this.checkSettings();
    }

    @property
    private _settings: EquipmentNodeSpritePair[] = [];
    @property({
        displayName: 'Slot -> Sprite',
        visible() {
            return this.type !== EquipmentType.None;
        }, 
        displayOrder: 1, 
        type: [EquipmentNodeSpritePair],
        tooltip: 'соответствия спрйтов и слотов костюма'
    })
    get settings() {
        return this._settings;
    }

    @property({ 
        displayName: 'Try set',
        tooltip: 'примерить костюм', 
        displayOrder: 2 
    })
    get trySet() { return false }
    set trySet(value) {
        this.wearSet();
    }

    checkSettings() {
        const newSettings = [];
        const slotsByType = this._equipmentSkeleton.getSlotsByType(this._type);
        slotsByType.forEach((slot: EquipmentSlot) => {
            const pair = new EquipmentNodeSpritePair()
            pair.setSlot(slot);
            
            const oldPair = this._settings.find((pair: EquipmentNodeSpritePair) => pair.slot === slot);
            if (oldPair) {
                pair.spriteFrame = oldPair.spriteFrame;
                pair.useTint = oldPair.useTint;
                pair.useSlotSize = oldPair.useSlotSize;
            }

            newSettings.push(pair);
        });

        this._settings = newSettings;
    }

    wearSet() {
        this._equipmentSkeleton.setSlotsToDefault();
        this._equipmentSkeleton.debugEquipmentSlots = false;
        this._equipmentSkeleton.wearedSet = this;
        this._settings.forEach((pair: EquipmentNodeSpritePair) => {
            let size: Size = Size.ZERO;
            if (pair.useSlotSize) {
                size = this._equipmentSkeleton.getSizeOfEquipmentSlot(pair.slot);
            } else {
                size = new Size(pair.spriteFrame.width, pair.spriteFrame.height);
            }

            pair.slot.setSlotStyle(pair.spriteFrame, size,  pair.useTint ? this._equipmentSkeleton.tint : null); 
        });
    }
}
 
@ccclass('EquipmentSkeleton')
@executeInEditMode
export class EquipmentSkeleton extends sp.Skeleton {
    //#region properties

    @property({ override: true, type: sp.SkeletonData })
    get skeletonData() {
        return this._skeletonData;
    }
    set skeletonData(value) {
        super.skeletonData = value;

        if (value) {
            this.createSocketNodes = true;
        } else {
            this._clearSocketNodes();
        }
    }

    @type([EquipmentSlot])
    private _equipmentSlots: EquipmentSlot[] = [];

    @property({ 
        group: { name: 'equipment data', id: '1' },
        tooltip: 'идентификатор данного манекена'
    })
    public id = '';
    @property
    private _tint: Color = null;
    @property({ 
        group: { name: 'equipment data', id: '1' },
        tooltip: 'оттенок для предметов одежды данного манекена', 
        type: Color 
    })
    get tint() {
        return this._tint;
    }
    set tint (value) {
        this._tint = value;

        if (this.wearedSet) this.wearedSet.wearSet();
        if (this._debugEquipmentSlots) this._styleDebugSlots();
    }

    @property
    private _boneNodes: Node[] = [];

    @property
    private _slotsOfType: Object = {};
    private _selectedType: EquipmentType = EquipmentType.None;
    private _selectedSlots: EquipmentSlot[] = [];

    @property({  
        displayName: 'Type', 
        group: { name: 'types', id: '2' },
        tooltip: 'тип предмета одежды', 
        displayOrder: 0,
        type: Enum(EquipmentType)
    })
    get type() {
        return this._selectedType;
    }
    set type(value) {
        if (!this._slotsOfType.hasOwnProperty(value)) {
            this._slotsOfType[value] = [];
        }

        this._selectedSlots = this._slotsOfType[value];
        this._selectedType = value;
    }

    @property({  
        displayName: 'Slots', 
        group: { name: 'types', id: '2' },
        tooltip: 'слоты данного предмета одежды', 
        displayOrder: 1,
        type: [EquipmentSlot],
        visible() {
            return this._selectedType !== EquipmentType.None;
        }
    })
    get slotsOfType() {
        return this._selectedSlots;
    }
    set slotsOfType(value) {
        this._slotsOfType[this._selectedType] = value;
        this._selectedSlots = value;

        this._selectedSet = EquipmentSet.None;
        this.setSlotsToDefault();
        this.debugEquipmentSlots = false;
    }

    @property
    private _sets: Object = {};
    private _selectedSet: EquipmentSet = EquipmentSet.None;
    private _setSettings: EquipmentSetHelper = null;
    @property({ visible: false })
    public wearedSet: EquipmentSetHelper = null;

    @property({  
        displayName: 'Set', 
        group: { name: 'sets', id: '2' },
        tooltip: 'костюм', 
        displayOrder: 0,
        type: Enum(EquipmentSet)
    })
    get set() {
        return this._selectedSet;
    }
    set set(value) {
        if (!this._sets.hasOwnProperty(value)) {
            this._sets[value] = new EquipmentSetHelper(this);
        }

        this._setSettings = this._sets[value];
        this._selectedSet = value;

        this._setSettings.checkSettings();
    }

    @property({  
        displayName: 'Settings', 
        group: { name: 'sets', id: '2' },
        tooltip: 'настройки костюма', 
        displayOrder: 1,
        type: EquipmentSetHelper,
        visible() {
            return this._selectedSet !== EquipmentSet.None;
        }
    })
    get settings() {
        return this._setSettings;
    }
    set settings(value) {
        this._sets[this._selectedSet] = value;
        this._setSettings = value;
    }
    
    @property({  
        displayName: 'Set to default', 
        group: { name: 'sets', id: '2' },
        tooltip: 'очистить слоты костюма', 
        displayOrder: 2
    })
    get setToDefault() { return false }
    set setToDefault(value) {
        this.setSlotsToDefault();
        this.debugEquipmentSlots = false;
    }

    @property({ 
        type: Layers.Enum, 
        displayName: 'Socket layer', 
        group: { name: 'creator', id: '2' },
        tooltip: 'слой для отрисовки слотов', 
        displayOrder: 2 
    })
    public socketLayer: Layers.Enum = Layers.Enum.UI_2D;

    @property({ 
        displayName: 'Recreate sockets', 
        group: { name: 'creator', id: '2' },
        tooltip: 'пересоздать слоты манекена', 
        displayOrder: 3,
        visible() {
            return this.skeletonData !== null;
        }
    })
    get createSocketNodes() { return false }
    set createSocketNodes(value) {
        this._clearSocketNodes();

        const sockets = [];
        const boneNodesMap: WeakMap<sp.spine.Bone, Node> = new WeakMap();

        const cascadeSearch: Function = (bone: sp.spine.Bone, nameArray: Array<Node>) => {
            const name = nameArray ? JSON.parse(JSON.stringify(nameArray)) : [];
            const boneData = bone.data;
            name.push(boneData.name);

            let node: Node = null;
            if (bone !== this._rootBone) {
                node = new Node(`Socket_${name.join('_')}`);
                node.layer = this.socketLayer;
                node.setParent(this.node);

                sockets.push(new sp.SpineSocket(name.join('/'), node));

                boneNodesMap.set(bone, node);
            }
            this._boneNodes[this._skeleton.bones.indexOf(bone)] = node;

            bone.children.forEach(child => {
                cascadeSearch(child, name);
            });
        };

        cascadeSearch(this._rootBone);

        this.sockets = sockets.concat(this.sockets);

        this._skeleton.slots.forEach((slot, i) => {
            if (boneNodesMap.get(slot.bone)) {
                const node: Node = new Node(`Slot_${slot.data.name}`);
                node.layer = this.socketLayer;
                node.setParent(boneNodesMap.get(slot.bone));

                const equipmentSlot = node.addComponent(EquipmentSlot);
                equipmentSlot.init(i);
                this._setSlotStartState(equipmentSlot, slot);

                this._equipmentSlots.push(equipmentSlot);
            }
        });
    }
    
    @property({ 
        displayName: 'Remove sockets', 
        group: { name: 'creator', id: '2' },
        tooltip: 'удалить слоты манекена', 
        displayOrder: 4,
        visible() {
            return this.skeletonData !== null;
        }
    })
    get clearSocketNodes() { return false }
    set clearSocketNodes(value) {
        this._clearSocketNodes();
    }

    
    @property
    private _debugSpriteFrame: SpriteFrame = null;

    @property
    private _debugEquipmentSlots: boolean = false;
    @property({ 
        displayName: 'Debug equipment slots', 
        group: { name: 'debugger', id: '2' },
        tooltip: 'залить слоты манекена фоном-отладчиком', 
        displayOrder: 2,
        visible() {
            return this.debugSpriteFrame !== null;
        }
    })
    get debugEquipmentSlots() { 
        return this._debugEquipmentSlots; 
    }
    set debugEquipmentSlots(value) {
        this.setSlotsToDefault();
        if (value) {
            this._styleDebugSlots();
        }
        this._debugEquipmentSlots = value;
    }
    //#endregion

    start () {
        if (EDITOR) {
            if (this.tint === null) {
                this.tint = Color.WHITE;
            }

            if (!this._debugSpriteFrame) {
                //@ts-ignore
                Editor.Message.request('asset-db', 'query-uuid', 'db://internal/default_ui/default_sprite_splash.png/spriteFrame').then(data => {  
                    const debugSpriteFrame = new SpriteFrame();
                    debugSpriteFrame.initDefault(data)
                    this._debugSpriteFrame = debugSpriteFrame;
                });
            }
        }
    }

    private _clearSocketNodes(): void {
        this.sockets.forEach((socket) => {
            if (socket.target) socket.target.destroy();
        });

        this.sockets = [];
        this._equipmentSlots = [];
        this._boneNodes = [];

        this._selectedType = EquipmentType.None;
        this._slotsOfType = {};
        this._sets = {};

        this._debugEquipmentSlots = false;
    }

    public setSlotsToDefault(type?: EquipmentType) {
        const slotNodes = typeof type === 'number' ? this.getSlotsByType(type) : this._equipmentSlots;

        slotNodes.forEach((slot: EquipmentSlot) => {
            slot.setToDefault();
        });

        this.wearedSet = null;
    }

    private _setSlotStartState(eqSlot: EquipmentSlot, slot: sp.spine.Slot) {
        const attach: sp.spine.RegionAttachment = <sp.spine.RegionAttachment>slot.attachment;

        if (slot && attach) {
            eqSlot.setStartState(
                new Vec3(attach.x, attach.y, 0),
                new Size(attach.width, attach.height),
                attach.rotation,
                new Vec2(attach.scaleX, attach.scaleY)
            );
        }
    }

    private _updateSlotesTransform() {
        this._skeleton.bones.forEach((bone: sp.spine.Bone, i: number) => {
            const node: Node = this._boneNodes[i];
           
            if (node) {
                const mtx = new Mat4();
                mtx.m00 = bone.a;
                mtx.m01 = bone.c;
                mtx.m04 = bone.b;
                mtx.m05 = bone.d;
                mtx.m12 = bone.worldX;
                mtx.m13 = bone.worldY;

                node.matrix = mtx;
            }
        });
    }

    private _styleDebugSlots() {
        this._equipmentSlots.forEach(eqSlot => {
            const tint: Color = this.tint.clone();
            tint.a = 120;
            eqSlot.setSlotStyle(this._debugSpriteFrame, this.getSizeOfEquipmentSlot(eqSlot),  tint);
        });
    }

    public getSlotOfEquipment(eqSlot: EquipmentSlot) {
        return this._skeleton.slots[eqSlot.slotIndex];
    }

    public getSlotsByType(type: EquipmentType) {
        if (this._slotsOfType.hasOwnProperty(type)) {
            return this._slotsOfType[type];
        } else {
            return [];
        }
    }

    public getSizeOfEquipmentSlot(eqSlot: EquipmentSlot) {
        const slot = this.getSlotOfEquipment(eqSlot);
        const attach: sp.spine.RegionAttachment = slot ? <sp.spine.RegionAttachment>slot.attachment : null;

        return (slot && attach) ? new Size(attach.width, attach.height) : Size.ZERO;
    }

    updateAnimation (deltaTime: number) {
        if (!EDITOR) {
            super.updateAnimation(deltaTime);
            this._updateSlotesTransform();
        }
    }

    public onEquipmentWearSet(set: EquipmentSet, id: String) {
        if (!id || this.id === id) {
            const settings = this._sets[set];
            if (settings) {
                settings.wearSet();
            }
        }
    }

    public onEquipmentTakeOff(type?: EquipmentType, id?: String) {
        if (!id || this.id === id) {
            this.setSlotsToDefault(type);
        }
    }

    public onDestroy() {
        super.onDestroy();
        this._clearSocketNodes();
    }
}