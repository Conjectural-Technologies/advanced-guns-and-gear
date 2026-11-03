Hooks.on("init", () => {
  const modernWeapons = {
    "antimatterRifle": "Compendium.advanced-guns-and-gear.items.Item.gngAntimatterRi3",
    "automaticRifle": "Compendium.advanced-guns-and-gear.items.Item.gngAutomaticRifl",
    "huntingRifle": "Compendium.advanced-guns-and-gear.items.Item.gngHuntingRifleX",
    "laserPistol": "Compendium.advanced-guns-and-gear.items.Item.gngLaserPistolX2",
    "laserRifle": "Compendium.advanced-guns-and-gear.items.Item.gngLaserRifleXX2",
    "revolver": "Compendium.advanced-guns-and-gear.items.Item.gngRevolverXXXXX",
    "semiautomaticPistol": "Compendium.advanced-guns-and-gear.items.Item.gngSemiautomatic",
    "shotgun": "Compendium.advanced-guns-and-gear.items.Item.gngShotgunXXXXXX"
  };

  foundry.utils.mergeObject(CONFIG.DND5E.weaponIds, modernWeapons);
  for (const key of Object.keys(modernWeapons)) {
    CONFIG.DND5E.weaponProficienciesMap[key] = "martial";
  }

  console.log("Advanced Guns & Gear | Modern Weapons Loaded");
});
