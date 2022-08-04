# cc3-equipment-skeleton
cc.Skeleton extension, which allows you to bind sprites to skeleton slots. Sprites will repeat skeleton movements

Add EquipmentSkeleton component on scene, then set SkeletonData property.
It will create children nodes in current node with EquipmentSlot components.
You can combine these slots in sets and bind sprite frames to each slot.
After that you can change sets on your skeleton by firing onEquipmentWearSet method of EquipmentSkeleton component.
All of bound sprites will repeat skeleton movements.