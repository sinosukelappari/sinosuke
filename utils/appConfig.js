const AppConfig = require("../models/AppConfig");

async function getAppConfig() {
  let config = await AppConfig.findOne({ key: "main" }).lean();

  if (!config) {
    const oldConfig = await AppConfig.findOne({}).lean();

    if (oldConfig) {
      const updatedConfig = await AppConfig.findByIdAndUpdate(
        oldConfig._id,
        {
          key: "main",
          dariBagianMode: oldConfig.dariBagianMode || "manual",
          spreadsheetUrl: oldConfig.spreadsheetUrl || "",
          googleScriptUrl: oldConfig.googleScriptUrl || "",
          kodeSatker: oldConfig.kodeSatker || "WP.3.PAS.4-",
          updatedBy: oldConfig.updatedBy || null
        },
        {
          new: true,
          runValidators: true
        }
      );

      return updatedConfig.toObject();
    }

    const createdConfig = await AppConfig.create({
      key: "main",
      dariBagianMode: "manual",
      spreadsheetUrl: "",
      googleScriptUrl: "",
      kodeSatker: "WP.3.PAS.4-"
    });

    return createdConfig.toObject();
  }

  return config;
}

async function updateAppConfig(data, userId) {
  const config = await AppConfig.findOneAndUpdate(
    { key: "main" },
    {
      key: "main",
      dariBagianMode: data.dariBagianMode || "manual",
      spreadsheetUrl: data.spreadsheetUrl || "",
      googleScriptUrl: data.googleScriptUrl || "",
      kodeSatker: data.kodeSatker || "WP.3.PAS.4-",
      updatedBy: userId || null
    },
    {
      new: true,
      upsert: true,
      runValidators: true
    }
  );

  return config;
}

module.exports = {
  getAppConfig,
  updateAppConfig
};