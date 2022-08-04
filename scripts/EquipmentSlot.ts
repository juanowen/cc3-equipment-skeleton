
import { _decorator, Component, UITransform, Sprite, sp, Color, SpriteFrame, Vec2, Vec3, Size } from 'cc';
const { ccclass, property, type, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = EquipmentSlot
 * DateTime = Fri Mar 25 2022 14:40:53 GMT+0300 (Москва, стандартное время)
 * Author = stanislav_korol
 * FileBasename = EquipmentSlot.ts
 * FileBasenameNoExtension = EquipmentSlot
 * URL = db://assets/scripts/EquipmentSlot.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
 
@ccclass('EquipmentSlot')
@executeInEditMode
export class EquipmentSlot extends Component {
    @type(UITransform)
    private _ui = null;
    @type(Sprite)
    private _sprite = null;
    @property({ visible: false })
    public slotIndex = -1;

    start () {
        this.init();
    }

    public init(slotIndex?: number): void {
        this._ui = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        this._sprite = this.node.getComponent(Sprite) || this.node.addComponent(Sprite);
        
        if (slotIndex) this.slotIndex = slotIndex;
    }

    public setStartState(position: Vec3, size: Size, rotation: number, scale: Vec2): void {
        this._ui.setContentSize(size);
        this.node.setPosition(position);
        this.node.setRotationFromEuler(new Vec3(0, 0, rotation));
        this.node.setScale(new Vec3(scale.x, scale.y, this.node.scale.z));
    }   

    public setSlotStyle(spriteFrame: SpriteFrame, size: Size, color?: Color): void {
        this._sprite.spriteFrame = spriteFrame;
        this._ui.setContentSize(size);

        if (color) this._sprite.color = color;
    }

    public setToDefault(): void {
        this._sprite.spriteFrame = null;
        this._sprite.color = Color.WHITE;
    }
}
