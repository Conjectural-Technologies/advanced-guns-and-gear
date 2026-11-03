import * as InventorsSchematics from "./inventors-schematics.mjs";

Hooks.on("init", () => {
  InventorsSchematics.registerHooks();

  CONFIG.DND5E.featureTypes.class.subtypes.inventorSchematic = "AGG.Feature.Class.InventorSchematic";
  CONFIG.DND5E.featureTypes.enchantment.subtypes.inventorSchematic = "AGG.Feature.Class.InventorSchematic";

  game.settings.register("advanced-guns-and-gear", "lastVersion", {
    name: "AGG.SETTING.VERSION.name",
    hint: "AGG.SETTING.VERSION.hint",
    scope: "world",
    config: false,
    type: String,
    default: "0.0.0"
  });

  console.log("Advanced Guns & Gear | Inventor's Schematics Loaded");
});
