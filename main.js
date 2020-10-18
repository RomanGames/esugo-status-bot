/*
 * えすごさんのリレーサーバーの状態を
 * 自動で教えてくれるDiscordBot
 * esugo-status-bot (on discord)
 */

// require

// file
const fs = require("fs");

// http
const https = require("https");
const url = require("url");
const request = require("request");

// Discord bot implements
const discord = require("discord.js");
const client = new discord.Client();

// const data
const PREFIX = "#est";
const INSPECTION = false;
const CONFIG_FILEPATH = "./config.json";
const ROMANGAMES_ID = "498452350663655424";
const INFO_MESSAGE =
  "こんにちは、えすごリレーサーバー稼働状況確認Botです。\n" +
  "このBotは非公式で、@RomanGames#4543 <@" +
  ROMANGAMES_ID +
  "> が作成しました。\n" +
  "\n" +
  "このBotは一定時間毎にえすごさんのリレーサーバーの状況を調べて教えてくれるBotです。\n" +
  "またコマンドもいくつか用意してあります。\n" +
  '"' +
  PREFIX +
  ' help" でコマンド一覧を確認できます。\n' +
  "初めは " +
  PREFIX +
  " channel set で通知チャンネルを登録しないと自動通知はできません。\n" +
  "\n" +
  "分からない事がある場合、@RomanGames4543 " +
  ROMANGAMES_ID +
  "> かこのBotにDMをしてみてください。\n" +
  "(BotにDMを送った場合、そのメッセージを転送しているので編集機能は適用されませんのでご注意ください。)";

// Response for Uptime Robot
const http = require("http");
http
  .createServer(function(request, response) {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Discord bot is active now \n");
    onPosted((forSend, sendFlag, ragPoint) => {
      if (sendFlag && !INSPECTION) {
        let color;
        if (ragPoint == 0) color = getColor(255, 255, 255);
        else if (ragPoint == 1) color = getColor(255, 255, 128);
        else if (ragPoint == 2) color = getColor(255, 255, 0);
        else if (ragPoint == 3) color = getColor(255, 128, 0);
        else color = getColor(255, 0, 0);
        let config = JSON.parse(fs.readFileSync(CONFIG_FILEPATH, "utf8"));
        // 全てサーバーの
        if (Object.keys(config) != undefined)
          Object.keys(config).forEach(guildID => {
            // 全てのチャンネルで
            if (config[guildID]["channels"] != undefined)
              config[guildID]["channels"].forEach(channelID => {
                client.guilds
                  .get(guildID)
                  .channels.get(channelID)
                  .sendMessage(
                    boxMessage(
                      "**えすごさんのリレーサーバーの最新状態**\n" + forSend,
                      color
                    )
                  );
              });
          });
      }
    });
  })
  .listen(3000);

// @botStarts
client.on("ready", message => {
  client.user.setActivity(PREFIX);
});

// @onJoin
client.on("guildCreate", guild => {
  let config = JSON.parse(fs.readFileSync(CONFIG_FILEPATH));
  config[guild.id] = { channels: new Array() };
  fs.writeFileSync(CONFIG_FILEPATH, JSON.stringify(config, null, 2));
  guild.systemChannel.sendMessage(boxMessage(INFO_MESSAGE));
  sendLog(
    "<@" +
      ROMANGAMES_ID +
      "> " +
      guild.name +
      " 鯖に入れられました。\n(オーナー: " +
      guild.owner.user.tag +
      ")"
  );
});

// @onExit
client.on("guildDelete", guild => {
  let config = JSON.parse(fs.readFileSync(CONFIG_FILEPATH));
  delete config[guild.id];
  fs.writeFileSync(CONFIG_FILEPATH, JSON.stringify(config, null, 2));
  sendLog(
    "<@" + ROMANGAMES_ID + "> " + guild.name + " 鯖から追い出されました。"
  );
});

// @onMessage
client.on("message", message => {
  if (message.author.id != client.user.id) {
    if (message.channel instanceof discord.TextChannel) {
      // コマンド
      // #est 単体
      if (message.content == PREFIX) {
        message.channel.sendMessage(boxMessage(INFO_MESSAGE));
        return;
      }
      if (message.content.substr(0, (PREFIX + " ").length) == PREFIX + " ") {
        if (!INSPECTION) {
          onCommand(
            client,
            message,
            message.content.substr((PREFIX + " ").length).split(" ")
          );
        } else {
          message.channel.sendMessage(
            "ただ今点検中ですので、\nしばらくしてからもう一度お試しください。"
          );
        }
        return;
      }

      message.mentions.users.forEach(user => {
        if (user.id == client.user.id)
          message.reply(
            PREFIX +
              "を送ってみてください！\n" +
              "分からない事があればDMをお願いします。\n" +
              "(BotにDMを送った場合、そのメッセージを転送しているので編集機能は適用されませんのでご注意ください。)"
          );
      });
    } else {
      // DM
      if (message.author.id != ROMANGAMES_ID) {
        // resive
        let forSend =
          "> by @" +
          message.author.tag +
          "(<@" +
          message.author.id +
          ">)\n" +
          message.content +
          "\n";
        message.attachments.forEach(attachment => {
          forSend += "\n" + attachment.url;
        });
        client.users.get(ROMANGAMES_ID).send(forSend);
      } else {
        // send
        let messages = message.content.split("\n");
        let forSend = "";
        for (let i = 1; i < messages.length; i++) forSend += messages[i] + "\n";
        message.attachments.forEach(attachment => {
          forSend += "\n" + attachment.url;
        });
        let user = client.users.get(messages[0]);
        if (user != undefined || forSend != "") {
          user.send(forSend);
          client.users
            .get(ROMANGAMES_ID)
            .send(
              "@" +
                user.tag +
                "(<@" +
                user.id +
                ">) に```\n" +
                forSend +
                "\n```と送りました。"
            );
        } else {
          if (user != undefined)
            client.users
              .get(ROMANGAMES_ID)
              .send(
                "\n<@" +
                  messages[0] +
                  "> というユーザーは見つかりませんでした。"
              );
          if (forSend == "")
            client.users
              .get(ROMANGAMES_ID)
              .send("メッセージ内容が空っぽです。");
        }
      }
    }
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
            "info: このBotについての説明\n" +
            "invite: このBotの招待コード\n" +
            "channel: 通知するチャンネルをいじる(チャンネルをいじれる権限が必要)\n" +
            "update: 強制的に最新の情報を読み込ませる\n" +
            "send: 最新の情報を取得"
        )
      );
      success[0] = true;
      break;
    case "info":
      message.channel.sendMessage(boxMessage(INFO_MESSAGE));
      success[0] = true;
      break;
    case "invite":
      message.channel.sendMessage(
        "招待リンク: https://discord.com/api/oauth2/authorize?client_id=766295251278233641&permissions=8&scope=bot"
      );
      success[0] = true;
      break;
    case "channel":
      if (
        message.guild.members
          .get(message.author.id)
          .permissions.has("MANAGE_CHANNELS")
      ) {
        success[1] = false;
        let config = JSON.parse(fs.readFileSync(CONFIG_FILEPATH));
        switch (args[1]) {
          case "set":
            if (
              config[message.guild.id]["channels"] == undefined ||
              !config[message.guild.id]["channels"].includes(message.channel.id)
            ) {
              config[message.guild.id]["channels"].push(message.channel.id);
              message.channel.sendMessage(
                boxMessage(
                  message.channel.name +
                    " が通知されるチャンネルに追加されました。\n" +
                    "この後このチャンネルで " +
                    PREFIX +
                    " channel remove と送ると解除できます。\n" +
                    "また、 " +
                    PREFIX +
                    " channel list で登録しているチャンネル一覧を表示できます。"
                )
              );
              onPosted((forSend, sendFlag, ragPoint) => {
                let color;
                if (ragPoint == 0) color = getColor(255, 255, 255);
                else if (ragPoint == 1) color = getColor(255, 255, 128);
                else if (ragPoint == 2) color = getColor(255, 255, 0);
                else if (ragPoint == 3) color = getColor(255, 128, 0);
                else color = getColor(255, 0, 0);
                message.channel.sendMessage(
                  boxMessage(
                    "**えすごさんのリレーサーバーサーバーの最新状態**\n" +
                      forSend,
                    color
                  )
                );
              });
              sendLog(
                message.author.tag +
                  " in " +
                  message.guild.name +
                  ": __channel set__ " +
                  message.channel.name
              );
            } else {
              message.channel.sendMessage(
                boxMessage("エラー: このチャンネルは既に登録されています。")
              );
            }
            success[1] = true;
            break;
          case "remove":
            if (
              config[message.guild.id]["channels"] != undefined &&
              config[message.guild.id]["channels"].includes(message.channel.id)
            ) {
              config[message.guild.id]["channels"] = config[message.guild.id][
                "channels"
              ].filter(c => c != message.channel.id);
              message.channel.sendMessage(
                boxMessage(
                  message.channel.name +
                    " が通知されるチャンネルから削除されました。"
                )
              );
              sendLog(
                message.author.tag +
                  " in " +
                  message.guild.name +
                  ": __channel remove__ " +
                  message.channel.name
              );
            } else {
              message.channel.sendMessage(
                boxMessage("エラー: このチャンネルはもともと登録されてません。")
              );
            }
            success[1] = true;
            break;
          case "list":
            let list = "__通知が登録されているチャンネル一覧__: ";
            if (
              config[message.guild.id]["channels"] != undefined &&
              config[message.guild.id]["channels"].length
            ) {
              config[message.guild.id]["channels"].forEach(channel => {
                list +=
                  "\n" +
                  client.guilds.get(message.guild.id).channels.get(channel)
                    .name;
              });
            } else {
              list += "\n通知が登録されているチャンネルはありません。";
            }
            message.channel.sendMessage(boxMessage(list));
            success[1] = true;
            break;
        }
        fs.writeFileSync(CONFIG_FILEPATH, JSON.stringify(config, null, 2));
        if (!success[1]) {
          message.channel.sendMessage(
            boxMessage(
              "エラー: channelコマンドの使い方が間違っています。\n" +
                "channelコマンドの使い方:\n" +
                "  " +
                PREFIX +
                " channel [set|remove|list]\n" +
                "set: これを送ったチャンネルで通知するようにします。\n" +
                "remove: setの逆で、通知しないようにします。\n" +
                "list: 通知するチャンネル一覧を表示します。"
            )
          );
        }
      } else {
        message.channel.sendMessage(
          boxMessage(
            args[0] +
              ": そのコマンドはチャンネルをいじれる権限がある人しか使えないコマンドです。"
          )
        );
      }
      success[0] = true;
      break;
    case "update":
      onPosted((forSend, sendFlag) => {
        message.channel.sendMessage(
          boxMessage(
            "最新の情報を読み込みました。\n" +
              (sendFlag ? "更新がありました。" : "更新はありませんでした。")
          )
        );
        sendLog(
          message.author.tag + " in " + message.guild.name + ": __update__"
        );
      });
      success[0] = true;
      break;
    case "send":
      onPosted((forSend, sendFlag, ragPoint) => {
        let color;
        if (ragPoint == 0) color = getColor(255, 255, 255);
        else if (ragPoint == 1) color = getColor(255, 255, 128);
        else if (ragPoint == 2) color = getColor(255, 255, 0);
        else if (ragPoint == 3) color = getColor(255, 128, 0);
        else color = getColor(255, 0, 0);
        message.channel.sendMessage(boxMessage(forSend, color));
        sendLog(
          message.author.tag + " in " + message.guild.name + ": __send__ "
        );
      });
      success[0] = true;
      break;
    case "notice":
      if (message.author.id == ROMANGAMES_ID) {
        success[1] = false;
        if (args.length > 1) {
          let forSend = "**お知らせ**";
          for (let i = 1; i < args.length; i++) forSend += "\n" + args[i];
          client.guilds.forEach(guild => {
            guild.systemChannel.sendMessage(boxMessage(forSend));
          });
          message.channel.sendMessage(boxMessage(forSend));
          message.channel.sensMeasage("を送信しました。");
          success[1] = true;
        }
        if (!success[1]) {
          message.channel.sendMessage(
            boxMessage(
              "エラー: noticeコマンドの使い方が間違っています。\n" +
                "noticeコマンドの使い方:\n" +
                "  " +
                PREFIX +
                " notice <message>"
            )
          );
        }
        success[0] = true;
      }
      break;
    case "guilds":
      if (message.author.id == ROMANGAMES_ID) {
        let forSend = "__サーバー一覧__:";
        let number = 0;
        client.guilds.forEach(guild => {
          forSend +=
            "\n" +
            ++number +
            ". " +
            guild.name +
            " (オーナー: " +
            guild.owner.user.tag +
            ")";
          if (args[1] == "id") forSend += " id: `" + guild.id + "`";
        });
        message.channel.sendMessage(boxMessage(forSend));
        success[0] = true;
      }
      break;
    case "channels":
      if (message.author.id == ROMANGAMES_ID) {
        success[1] = false;
        if (args.length > 1) {
          let guild = client.guilds.get(args[1]);
          if (guild == undefined) {
            let number = 0;
            client.guilds.forEach(g => {
              if (args[1] == "" + ++number) guild = g;
            });
            if (guild == undefined)
              message.channel.sendMessage(
                args[1] + " のID/番号のサーバーは見つかりませんでした"
              );
          }
          if (guild != undefined) {
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
          }
          success[1] = true;
        }
        if (!success[1]) {
          message.channel.sendMessage(
            boxMessage(
              "エラー: channelsコマンドの使い方が間違っています。\n" +
                "channelsコマンドの使い方:\n" +
                "  " +
                PREFIX +
                " channels <guildId>"
            )
          );
        }
        success[0] = true;
      }
      break;
    case "members":
      if (message.author.id == ROMANGAMES_ID) {
        success[1] = false;
        if (args.length >= 2) {
          let guild = client.guilds.get(args[1]);
          if (guild == undefined) {
            let number = 0;
            client.guilds.forEach(g => {
              if (args[1] == "" + ++number) guild = g;
            });
            if (guild == undefined)
              message.channel.sendMessage(
                args[1] + " のID/番号のサーバーは見つかりませんでした"
              );
          }
          if (guild != undefined) {
            let forSend = "__`" + guild.name + "` のメンバー一覧__:";
            guild.members.forEach(member => {
              forSend += "\n<";
              if (member.roles.size > 1) {
                member.roles.forEach(role => {
                  if (role.name != "@everyone") forSend += role.name + ",";
                });
                forSend = forSend.slice(0, -1);
              }
              forSend += "> " + member.user.tag;
              if (args[2] == "id") forSend += " id: `" + member.user.id + "`";
            });
            message.channel.sendMessage(boxMessage(forSend));
          }
          success[1] = true;
        }
        if (!success[1]) {
          message.channel.sendMessage(
            boxMessage(
              "エラー: membersコマンドの使い方が間違っています。\n" +
                "membersコマンドの使い方:\n" +
                "  " +
                PREFIX +
                " members <guildId>"
            )
          );
        }
        success[0] = true;
      }
      break;
    case "config":
      if (message.author.id == ROMANGAMES_ID) {
        success[1] = false;
        switch (args[1]) {
          case "get":
            message.channel.sendMessage(
              JSON.stringify(
                JSON.parse(fs.readFileSync(CONFIG_FILEPATH)),
                null,
                2
              )
            );
            success[1] = true;
            break;
          case "set":
            if (args.length > 2) {
              let forConfig = "";
              for (let i = 2; i < args.length; i++) {
                forConfig += args[i] + " ";
              }
              message.channel.sendMessage(
                "__元のconfig__:\n" +
                  JSON.stringify(
                    JSON.parse(fs.readFileSync(CONFIG_FILEPATH)),
                    null,
                    2
                  )
              );
              fs.writeFileSync(CONFIG_FILEPATH, forConfig);
              message.channel.sendMessage("設定完了");
              success[1] = true;
            }
            break;
        }
        if (!success[1]) {
          message.channel.sendMessage(
            boxMessage(
              "エラー: configコマンドの使い方が間違っています。\n" +
                "configコマンドの使い方:\n" +
                "  " +
                PREFIX +
                " config get\n" +
                "  " +
                PREFIX +
                " config set <新しいconfig>"
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

function onPosted(callback) {
  const statusFilePath = "./status.json";
  const newStatusUrl =
    "https://files.esugo.net/mcsvrhost/status/api/getstatus/";
  // download
  let newStatusJson = "";
  const req = https
    .get(newStatusUrl, res => {
      res.setEncoding("utf8");
      res.on("data", chunk => {
        newStatusJson += chunk;
      });
      res.on("end", () => {
        // get status
        const newStatus = JSON.parse(newStatusJson);
        const oldStatus = JSON.parse(fs.readFileSync(statusFilePath, "utf8"));
        // check difference
        let sendFlag = false;
        let forSends = new Array();
        let ragPoint = 0;
        for (let i = 0; i < oldStatus["servers"].length; i++) {
          // search
          let DeletedServer = true;
          for (let j = 0; j < newStatus["servers"].length; j++) {
            if (
              newStatus["servers"][j]["serverDisplayName"] ==
              oldStatus["servers"][i]["serverDisplayName"]
            ) {
              let newStatusStatus = unescape(newStatus["servers"][j]["status"])
                .replace('<font color="', ":")
                .replace('">', "_circle: ")
                .replace("</font>", "");
              let oldStatusStatus = unescape(oldStatus["servers"][i]["status"])
                .replace('<font color="', ":")
                .replace('">', "_circle: ")
                .replace("</font>", "");
              let newStatusResponseStatus = unescape(
                newStatus["servers"][j]["responseStatus"]
              )
                .replace('<font color="', ":")
                .replace('">', "_circle: ")
                .replace("</font>", "");
              let oldStatusResponseStatus = unescape(
                oldStatus["servers"][i]["responseStatus"]
              )
                .replace('<font color="', ":")
                .replace('">', "_circle: ")
                .replace("</font>", "");
              // status code
              let statusCodeForSend;
              let statusCode = newStatus["servers"][j]["code"];
              switch (statusCode.split("_")[0]) {
                case "down":
                  statusCodeForSend = ":no_entry:";
                  ragPoint += 2;
                  break;
                case "slow":
                  if (parseInt(statusCode.split("_")[1]) >= 3) {
                    statusCodeForSend = ":no_entry:";
                    ragPoint += 2;
                  } else {
                    statusCodeForSend = ":warning:";
                    ragPoint += 1;
                  }
                  break;
                case "full":
                  if (statusCode.split("_")[1] == "normal")
                    statusCodeForSend = ":white_check_mark:";
                  break;
              }
              // for send
              if (
                newStatusStatus != oldStatusStatus ||
                newStatusResponseStatus != oldStatusResponseStatus
              )
                sendFlag = true;
              forSends.push(
                "> " +
                  statusCodeForSend +
                  " " +
                  unescape(newStatus["servers"][j]["serverDisplayName"]) +
                  "\n" +
                  (newStatusStatus != oldStatusStatus
                    ? "<更新>稼働状況: "
                    : "稼働状況: ") +
                  newStatusStatus +
                  "\n" +
                  (newStatusResponseStatus != oldStatusResponseStatus
                    ? "<更新>応答速度: "
                    : "応答速度: ") +
                  newStatusResponseStatus
              );
              DeletedServer = false;
              break;
            }
          }
          if (DeletedServer) {
            // deleted server
            sendFlag = true;
            forSends.push(
              "> :heavy_minus_sign: " +
                unescape(oldStatus["servers"][i]["serverDisplayName"]) +
                " は無くなりました。"
            );
          }
        }
        for (let i = 0; i < newStatus["servers"].length; i++) {
          let newServer = true;
          for (let j = 0; j < oldStatus["servers"].length; j++) {
            if (
              oldStatus["servers"][j]["serverDisplayName"] ==
              newStatus["servers"][i]["serverDisplayName"]
            ) {
              newServer = false;
              break;
            }
          }
          if (newServer) {
            // new server
            let newStatusStatus = unescape(newStatus["servers"][i]["status"])
              .replace('<font color="', ":")
              .replace('">', "_circle: ")
              .replace("</font>", "");
            let newStatusResponseStatus = unescape(
              newStatus["servers"][i]["responseStatus"]
            )
              .replace('<font color="', ":")
              .replace('">', "_circle: ")
              .replace("</font>", "");
            sendFlag = true;
            forSends.push(
              "> :heavy_plus_sign: " +
                unescape(newStatus["servers"][i]["serverDisplayName"]) +
                " が追加されました。\n" +
                "稼働状況: " +
                newStatusStatus +
                "\n" +
                "応答速度: " +
                newStatusResponseStatus
            );
          }
        }
        // send
        let forSend =
          forSends.reduce((acc, forSend) => acc + forSend + "\n", "") +
          "\n　　　　最終更新: " +
          datetostr(
            new Date(
              newStatus["updatedTime"] +
                (new Date().getTimezoneOffset() + 9 * 60) * 60 * 1000
            ),
            "MM/DD hh:mm:ss",
            false
          ) +
          "";
        //sendLog("Postされました\n" + forSend);
        callback(forSend, sendFlag, ragPoint);
        // update file
        fs.writeFileSync(statusFilePath, JSON.stringify(newStatus, null, 2));
      });
    })
    .on("error", e => {
      sendLog("Error: " + e.message);
    });
  req.end();
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

function boxMessage(message, color = getColor(255, 255, 255)) {
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
  color = getColor(255, 255, 255)
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

function datetostr(date, format, is12hours) {
  var weekday = ["日", "月", "火", "水", "木", "金", "土"];
  if (!format) {
    format = "YYYY/MM/DD(WW) hh:mm:ss";
  }
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var weekday = weekday[date.getDay()];
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var secounds = date.getSeconds();

  var ampm = hours < 12 ? "AM" : "PM";
  if (is12hours) {
    hours = hours % 12;
    hours = hours != 0 ? hours : 12;
  }

  var replaceStrArray = {
    YYYY: year,
    Y: year,
    MM: ("0" + month).slice(-2),
    M: month,
    DD: ("0" + day).slice(-2),
    D: day,
    WW: weekday,
    hh: ("0" + hours).slice(-2),
    h: hours,
    mm: ("0" + minutes).slice(-2),
    m: minutes,
    ss: ("0" + secounds).slice(-2),
    s: secounds,
    AP: ampm
  };

  var replaceStr = "(" + Object.keys(replaceStrArray).join("|") + ")";
  var regex = new RegExp(replaceStr, "g");

  let ret = format.replace(regex, function(str) {
    return replaceStrArray[str];
  });

  return ret; //datetostr(new Date(), 'Y/MM/DD(WW) hh:mm:ss AP', false)
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
