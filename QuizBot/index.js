const {Telegraf} = require('telegraf');
const path = require('path');
const fs = require("fs");
const {BOT_TOKEN} = require('config');


//-------- Create Bot Client ----------- //
const bot = new Telegraf(BOT_TOKEN);


//-------- Loading all modules ----------- //

const pluginsDir = path.join(__dirname, "./plugins/");
fs.readdir(pluginsDir, (err, files) => {
  if (err) {
    console.error("Error reading plugins directory:", err);
    return;
  }
  const modules = files.filter((file) => file.endsWith(".js"));
  modules.forEach((module) => {
    const modulePath = path.join(pluginsDir, module);
    const plugin = require(modulePath);

    if (plugin) {
      console.log(`Loaded plugin module: ${module}`);
    } else {
      console.log(`Invalid plugin module: ${module}`);
    };
  });
});


// --------- Error handling ------------- //
bot.catch((err) => {
    console.error('Error:', err);
});

// ---------- Start polling -------------- //
bot.launch({dropPendingUpdates : true});
console.log("Bot Deployed Successfully !!");


