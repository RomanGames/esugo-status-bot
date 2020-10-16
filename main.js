// Response for Uptime Robot
const http = require("http");
http
  .createServer(function(request, response) {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Discord bot is active now \n");
    onPosted();
  })
  .listen(3000);

// Discord bot implements
const discord = require("discord.js");
const client = new discord.Client();

// const data
const PREFIX = "#est";
const ROMANGAMES_ID = "498452350663655424";
const INFO_MESSAGE = (
  "こんにちは、えすごリレーサーバー稼働状況確認Botです。\n" +
    "このBotは非公式で、@RomanGames#4543 が作成しました。\n" +
    "\n" +
    "このBotは一定時間毎にリレーサーバーの状況を調べて教えてくれるBotです。\n" +
    "またコマンドもいくつか用意してあります。\n" +
    '"' + PREFIX + ' help" でコマンド一覧を確認できます。'
);

// @botStarts
client.on("ready", message => {
  client.user.setActivity(PREFIX);
});

// @onJoin
client.on("guildCreate", guild => {
  guild.systemChannel.sendMessage(
    boxMessage(INFO_MESSAGE)
  );
  sendLog("@RomanGames#4543 " + guild.name + " 鯖に入れられました。");
});

// @onExit
client.on("guildDelete", guild => {
  sendLog("@RomanGames#4543 " + guild.name + " 鯖から追い出されました。");
});

// @onMessage
client.on("message", message => {
  if (!message.author.bot) {
    // コマンド
    // #est 単体
    if (message.content == PREFIX) {
      message.channel.sendMessage(
        boxMessage(INFO_MESSAGE)
      );
      return;
    }
    if (message.content.substr(0, (PREFIX + " ").length) == (PREFIX + " ")) {
      onCommand(client, message, message.content.substr((PREFIX + " ").length).split(" "));
      return;
    }
    
    message.reply(
      PREFIX + "を送ってみてください！"
    );
    
  }
});

function onCommand(client, message, args) {
  let success = [false];

  switch (args[0]) {
    case "help":
      message.channel.sendMessage(
        boxMessage(
          "**コマンド一覧**\n" +
            "help: これ\n" +
            "info: このBotについての説明\n"
        )
      );
      success[0] = true;
      break;
    case "info":
      message.channel.sendMessage(
        boxMessage(INFO_MESSAGE)
      );
      success[0] = true;
      break;
    case "invite":
      message.channel.sendMessage(
        "招待リンク: https://discord.com/api/oauth2/authorize?client_id=766295251278233641&permissions=781376&scope=bot"
      );
      success[0] = true;
      break;
    case "guilds":
      if (message.author.id == ROMANGAMES_ID) {
        let forSend = "__サーバー一覧__:";
        client.guilds.forEach(guild => {
          forSend +=
            "\n" + guild.name + " (オーナー: " + guild.owner.user.tag + ")";
          if (args[1] == "id") forSend += " id: `" + guild.id + "`";
        });
        message.channel.sendMessage(boxMessage(forSend));
        success[0] = true;
      }
      break;
    case "channels":
      if (message.author.id == ROMANGAMES_ID) {
        success[1] = false;
        if (args.length >= 2) {
          let guild = client.guilds.get(args[1]);
          let forSend = "__`" + guild.name + "` のチャンネル一覧__:";
          guild.channels.forEach(channel => {
            if (channel.type != "category") {
              forSend +=
                "\n<" +
                channel.parent +
                "|" +
                channel.type +
                "> " +
                channel.name;
              if (args[2] == "id") forSend += " id: `" + channel.id + "`";
            }
          });
          message.channel.sendMessage(boxMessage(forSend));
          success[1] = true;
        }
        if (!success[1]) {
          message.channel.sendMessage(
            boxMessage(
              "エラー: channelsコマンドの使い方が間違っています。\n" +
                "channelsコマンドの使い方:\n" +
                "  " + PREFIX + " channels <guildId>"
            )
          );
        }
        success[0] = true;
      }
      break;
  }

  // 失敗
  if (!success[0]) {
    message.channel.sendMessage(
      boxMessage(
        args[0] +
          ": そのコマンドは存在しないか、\n" +
          "製作者用コマンドの可能性があります。"
      )
    );
  }
}

function onPosted() {
  sendLog("Postされた！");
}

function sendLog(text) {
  let date = new Date(
    Date.now() + (new Date().getTimezoneOffset() + 9 * 60) * 60 * 1000
  );
  client.guilds
    .get(process.env.LOG_GUILD_ID)
    .channels.get(process.env.LOG_CHANNEL_ID)
    .sendMessage(
      "[" +
        date.getFullYear() +
        "/" +
        (date.getMonth() + 1) +
        "/" +
        date.getDate() +
        " " +
        date.getHours() +
        ":" +
        date.getMinutes() +
        ":" +
        date.getSeconds() +
        "] " +
        text
    );
}

function boxMessage(message, color = getColor(253, 224, 207)) {
  return {
    embed: {
      color: color,
      description: message
    }
  };
}
function boxMessageWithAuthor(
  message,
  author,
  color = getColor(253, 224, 207)
) {
  return {
    embed: {
      color: color,
      description: message,
      author: {
        name: author.tag,
        icon_url: author.avatarURL
      }
    }
  };
}

function getColor(red, green, blue) {
  if (red < 0x00) red = 0x00;
  if (red > 0xff) red = 0xff;
  if (green < 0x00) green = 0x00;
  if (green > 0xff) green = 0xff;
  if (blue < 0x00) blue = 0x00;
  if (blue > 0xff) blue = 0xff;
  return red * 0x010000 + green * 0x000100 + blue * 0x000001;
}

if (process.env.DISCORD_BOT_TOKEN == undefined) {
  console.log("please set ENV: DISCORD_BOT_TOKEN");
  process.exit(0);
}

client.login(process.env.DISCORD_BOT_TOKEN);
