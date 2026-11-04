const templateItems = {
  common: "Compendium.advanced-guns-and-gear.items.Item.gngCommonWondro2",
  uncommon: "Compendium.advanced-guns-and-gear.items.Item.gngUncommonWond2",
  rare: "Compendium.advanced-guns-and-gear.items.Item.gngRareWondrous2"
};

function isPhysicalItemType(type) {
  return Boolean(CONFIG.Item.dataModels[type]?.schema.fields.quantity);
}

async function createPlanData(sourceItem) {
  if ( !validatePlanItem(sourceItem) ) return;
  const sourceTemplate = await fromUuid(templateItems[sourceItem.system.rarity]);
  if ( !sourceTemplate ) throw new Error(`Advanced Guns & Gear | Missing schematic template for ${sourceItem.system.rarity}.`);
  const template = sourceTemplate.clone({}, { keepId: true });

  const activity = template.system.activities.getByType("enchant")[0];
  if ( !activity?.effects.length ) throw new Error(`Advanced Guns & Gear | Missing schematic enchantment for ${template.name}.`);
  const effects = activity.toObject().effects;
  const effect = await activity.effects[0].getEffect();
  if ( !effect ) throw new Error(`Advanced Guns & Gear | Missing schematic effect for ${template.name}.`);
  const effectData = effect.toObject();
  effectData._id = effects[0]._id;
  effectData.name = sourceItem.name;
  delete effectData._key;
  effects[0].uuid = null;
  effects[0].riders.item = [sourceItem.uuid];

  template.updateSource({
    // Generated plans need a private effect because their name depends on the chosen item.
    effects: [...template.toObject().effects.filter(e => e._id !== effectData._id), effectData],
    [`system.activities.${activity.id}.effects`]: effects,
    name: sourceItem.name,
    "system.description.value": template.system.description.value + `<hr><p>@Embed[${sourceItem.uuid} caption=false]{${sourceItem.name}}</p>`
  });

  return game.items.fromCompendium(template);
}

function validatePlanItem(item) {
  if ( !isPhysicalItemType(item.type) ) {
    ui.notifications.warn("AGG.InventorSchematic.Warning.Physical", { localize: true });
    return false;
  }

  if ( Object.hasOwn(templateItems, item.system.rarity) ) {
    if ( item.system.type?.value !== "wondrous" ) {
      ui.notifications.warn("AGG.InventorSchematic.Warning.Wondrous", { localize: true });
      return false;
    }
  }
  else {
    ui.notifications.warn("AGG.InventorSchematic.Warning.Rarity", { localize: true });
    return false;
  }

  if ( item.system.properties.has("cursed") ) {
    ui.notifications.warn("AGG.InventorSchematic.Warning.Cursed", { localize: true });
    return false;
  }

  return true;
}

export function registerHooks() {
  Hooks.on("createItem", createItem);
  Hooks.on("getItemContextOptions", getItemContextOptions);
}

async function createItem(item, options, userId) {
  if ( !options.isAdvancement || (userId !== game.user.id) || !item.identifier.endsWith("-item-plan") ) return;
  const [rarity] = item.identifier.split("-", 1);
  const otherRarities = [...Object.keys(CONFIG.DND5E.itemRarity).filter(r => r !== rarity), "_blank"];
  const filters = {
    locked: {
      documentClass: "Item",
      types: new Set(Object.keys(Item.implementation.compendiumBrowserTypes().physical.children)),
      additional: {
        properties: { cursed: -1, mgc: 1 },
        rarity: { [rarity]: 1, ...Object.fromEntries(otherRarities.map(r => [r, -1])) }
      },
      arbitrary: [{ k: "system.type.value", v: "wondrous" }]
    }
  };
  const result = await dnd5e.applications.CompendiumBrowser.selectOne({
    filters, hint: game.i18n.format("AGG.InventorSchematic.Hint", { description: item.name })
  }).then(fromUuid);
  if ( !result ) return;
  const createData = await createPlanData(result);
  if ( !createData ) return;
  await item.update(createData);
}

async function _createPlanHandler(li) {
  const actor = game.user.character?.classes?.inventor || !game.user.can("ITEM_CREATE")
    ? game.user.character : null;
  if ( !actor && !game.user.can("ITEM_CREATE") ) {
    ui.notifications.warn("AGG.InventorSchematic.Warning.Permissions", { localize: true });
    return;
  }

  const item = await fromUuid(this.collection.index.get(li.dataset.entryId).uuid);
  const createData = await createPlanData(item);
  if ( !createData ) return;
  const destName = actor ? actor.name : game.i18n.format("SIDEBAR.DirectoryTitle", {
    type: game.i18n.localize("DOCUMENT.Item")
  });
  await Item.implementation.create(createData, { parent: actor });
  ui.notifications.success("AGG.InventorSchematic.Success", {
    localize: true,
    format: {item: item.name, actor: destName}
  });
}

function getItemContextOptions(application, menuItems) {
  if ( !(application.collection instanceof foundry.documents.collections.CompendiumCollection) ) return;
  menuItems.push({
    name: "AGG.InventorSchematic.Create",
    icon: '<i class="fa-solid fa-compass-drafting"></i>',
    callback: _createPlanHandler.bind(application),
    condition: li => {
      const item = application.collection.index.get(li.dataset.entryId);
      return isPhysicalItemType(item.type);
    }
  });
}
