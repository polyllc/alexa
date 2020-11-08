const Discord = require("discord.js");
const bot = new Discord.Client();
const ytdl = require('ytdl-core');
const fs = require('fs');
const yt = require('simpleyt');
var {google} = require('googleapis');
var youtube = google.youtube({
   version: 'v3',
   auth: "youtube api key here (if you dont want to have this, just comment out functions: ytplaylist and autogen, remember to remove those commands too)"
});
var mysql = require("mysql");
const { ServerResponse } = require("http"); //i didn't add this, what? eh visual studio code doin its thing
const { commandDir } = require("yargs");

var db_config = {
  host: "your host, if its running on the same computer, then localhost",
  user: "user",
  password: "password",
  database: "database (usually mysql)"
};


function handleDisconnect() { //yay stackoverflow!!!!
  con = mysql.createConnection(db_config); // Recreate the connection, since
                                                  // the old one cannot be reused.

  con.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  con.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();

bot.login('bot token here');

var queue = new Map(); //the huge list of server queues

//word of note, some commands use a substr to get arguments with multiple spaces. im aware thats not the best method, but i does save space and im not really going to change the command anytime soon

bot.on('message', message =>{
    queue.forEach(value => { //if someone disconnects a bot with the right click menu, it wont do the proper delete of the queue, so every time someone sends a message, itll delete it
      if(!message.guild.me.voice.channel){
        if(value.guildID == message.guild.id){
          queue.delete(message.guild.id);
        }
      }
    });

    let command = message.content.toLowerCase();
    if (!message.guild) return;

    const serverQueue = queue.get(message.guild.id);

    if(command.startsWith("alexa, play ")){
        play(message, serverQueue);
    }
    if(command.startsWith("alexa, playurl")){
      playurl(message, serverQueue);
    }
    if(command.startsWith("alexa, dc")){
        dc(message, serverQueue);
    }
    if(command.startsWith("alexa, skip")){
        skip(message, serverQueue);
    }
    if(command.startsWith("alexa, np")){
        np(message.channel, serverQueue);
    }
    if(command.startsWith("alexa, queue")){
        showQueue(message, serverQueue);
    }
    if(command.startsWith("alexa, shuffle")){
        shuffleSongs(message, serverQueue);
    }
    if(command.startsWith("alexa, create playlist")){
        createPlaylist(serverQueue, message);
    }
    if(command.startsWith("alexa, playlist")){
        playPlaylist(serverQueue, message)
    }
    if(command.startsWith("alexa, find")){
        findPlaylists(message);
    }
    if(command.startsWith("alexa, remove")){
        remove(message, serverQueue);
    }
    if(command.startsWith("alexa, swap")){
        swapsong(message, serverQueue);
    }
    if(command.startsWith("alexa, pause")){
        pause(message, serverQueue);
    }
    if(command.startsWith("alexa, resume")){
        resume(message, serverQueue);
    }
    if(command.startsWith("alexa, vol")){
        volume(message, serverQueue);
    }
    if(command.startsWith("alexa, info")){
        playlistInfo(message);
    }
    if(command.startsWith("alexa, update playlist")){
      updatePlaylist(serverQueue, message);
    }
    if(command.startsWith("alexa, yt")){ //todo: update with the new yt searcher
        ytplaylist(serverQueue, message);
    }
    if(command.startsWith("alexa, auto")){ //todo: update with the new yt searcher
      autogen(serverQueue, message);
    }
    if(command.startsWith("alexa, seek")){ //sometimes works? its really weird how it works
      setSeek(message, serverQueue);
    }
    if(command.startsWith("alexa, repeat song")){
      repeatSong(message, serverQueue);
    }
    if(command.startsWith("alexa, delete this")){
      message.channel.send("on it");
    }
    if(command.startsWith("alexa, i am high")){
      message.reply("dont worry about it, ill hook you up");
      message.content = "alexa, playurl https://www.youtube.com/watch?v=p3B8bMc2kso";
      playurl(message, serverQueue, "https://www.youtube.com/watch?v=p3B8bMc2kso");
    }
    if(command.startsWith("alexa, are you dead")){
      message.channel.send("maybe");
    }
    if(command.startsWith("alexa, help")){
        message.channel.send({
          embed: new Discord.MessageEmbed().setTitle("Help")
          .setColor("#df12df")
          .setDescription("alexa, help - The help section\nalexa, play - searches YouTube with the query\nalexa, playurl - plays a url from YouTube, much faster than alexa, play and doesn't use my quota\nalexa, dc - Disconnect from voice channel\nalexa, skip - skips the song\nalexa, np - shows what playing right now\nalexa, queue [page number] - shows the queue. Put the page number if the queue is long than 10\nalexa, shuffle - shuffles the songs\nalexa, create playlist [playlist name] - creates a new playlist that anyone in the guild and you can use, songs taken from queue\nalexa, playlist [playlist ID] - adds all songs in a playlist to the queue with the playlist ID\nalexa, find [g | m] - finds playlist from your guild (g) or from you (m)\nalexa, info [playlist ID] [page]- shows info about playlist\nalexa, update playlist [ID] - updates your playlist with the songs in the queue\nalexa, remove [index] - removes a song from the queue with the index\nalexa, swap [index 1] [index 2] - swaps 2 songs in a queue by their index\nalexa, pause - pause\nalexa, resume - resume\nalexa, vol - set the volume (0-100)\nalexa, auto [query] - auto generates the top 50 search results from YouTube\nalexa, repeat song [index] [amount] - repeats a song/video from the queue [amount] times.") //wow why did i make this all in one line?!?!!? its called laziness, i started it on one line so i continued. i am only making the line longer with this comment...
          })
    }

});

function ytplaylist(squeue, message){ //gets the first 50 videos from a yt playlist, its really slow and i should definitely update it
  var voicec;
  if (message.member.voice.channel) {
      voicec = message.member.voice.channel;
  }
  else{
      message.reply("How can I play despacito if you despaciaren't in a voice chat");
      return 0;
  }
  const permissions = voicec.permissionsFor(message.client.user);
if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
  return message.channel.send('How am I supposed to play despacito if I despacican\'t join or speak in a voice chat?');
}
var pid = message.content.split(" ")[2];
youtube.playlistItems.list({
  part: "snippet, contentDetails",
  playlistId: pid,
  maxResults: 50
}).then(async function(response) {
          var tempsongs = [];
          message.reply("Adding songs into queue. Since this is a YouTube playlist, it might take much longer than usual while the data that is needed will be downloaded");
          for(var i = 0; i < response.data.items.length; i++){
            if(response.data.items[i].snippet.title == "Deleted video"){
              i++;
            }
            var id = response.data.items[i].contentDetails.videoId;
           // id = id.replace(/^[a-zA-Z0-9-_]{11}$/, "");
            const songInfo = await ytdl.getBasicInfo("https://youtube.com/watch?v=" + id).catch(console.log("ytdl do be stupid"));

            const song = {
                title: songInfo.videoDetails.title,
                url: "https://youtube.com/watch?v=" + id,
                img: songInfo.player_response.videoDetails.thumbnail.thumbnails[songInfo.player_response.videoDetails.thumbnail.thumbnails.length-1].url,
                len: songInfo.videoDetails.lengthSeconds,
                id: songInfo.videoDetails.videoId
            };
           tempsongs.push(song);
          
          }

  if (!squeue) {
    const queueConstruct = {
        channel: message.channel,
        voiceChannel: voicec,
        connection: null,
        songs: [],
        volume: 0.6,
        playing: true,
        seek: 0,
        guildName: message.guild.name,
        guildID: message.guild.id
    };

    queue.set(message.guild.id, queueConstruct);

    queueConstruct.songs = queueConstruct.songs.concat(tempsongs);

    try {
        var connection = await voicec.join();
        queueConstruct.connection = connection;
        playSong(message.guild.id, queueConstruct.songs[0]);
    } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send(err);
    }
  }
  else{
     squeue.songs = squeue.songs.concat(tempsongs);
  }
  message.channel.send("Added songs to queue!");
}).catch( console.log("meh"));
}

async function play(message, squeue){
    var voicec;
    if (message.member.voice.channel) {
        voicec = message.member.voice.channel;
    }
    else{
        message.reply("How can I play despacito if you despaciaren't in a voice chat");
        return 0;
    }
    const permissions = voicec.permissionsFor(message.client.user);
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return message.channel.send('How am I supposed to play despacito if I despacican\'t join or speak in a voice chat?');
	}

    let command = message.content.toLowerCase();
    let query = command.substr(12);
    var yid = "";
    if(query == "despacito"){ //if its despacito, you dont have to search
      yid = "kJQP7kiw5Fk";
      processPlay(squeue, "https://youtube.com/watch?v=kJQP7kiw5Fk", message, voicec);
    }
    else{
     yt(query).then(result => {
        if(result){
          if(result[0]){
            yid = result[0].identifier;
            var vid = "https://www.youtube.com/watch?v=" + yid;
          }
          else{
            message.reply("The query did not give any results. Use alexa, playurl {url} for youtube links.");
            return;
          }

          if(!vid){
            message.reply("seems to be an error, the link was never provided to me from youtube search! not your fault, completely youtube's fault");
            return;
          }
          
          processPlay(squeue, vid, message, voicec);
          
        }
      });
    }
}


function playurl(message, squeue, url = ""){
    var voicec;
      if (message.member.voice.channel) {
          voicec = message.member.voice.channel;
      }
      else{
          message.reply("How can I play despacito if you despaciaren't in a voice chat");
          return 0;
      }
      const permissions = voicec.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      return message.channel.send('How am I supposed to play despacito if I despacican\'t join or speak in a voice chat?');
    }
    if(url == ""){
       var vid = message.content.substr(15);
    }
    else{
       var vid = url; 
    }

    processPlay(squeue, vid, message, voicec);

}


async function processPlay(squeue, vid, message, voicec){
  if(vid === "" || vid === undefined){
    message.reply("An error occured when trying to play one of the tracks");
    return;
  }
  console.log("processPlay, vid: " + vid);
  const songInfo = await ytdl.getBasicInfo(vid); //sometimes error, could not find playing config, although much rarer with the new ytdl-core update (rip ytdl)

  const song = { //get song info
      title: songInfo.videoDetails.title,
      url: vid,
      img: songInfo.player_response.videoDetails.thumbnail.thumbnails[songInfo.player_response.videoDetails.thumbnail.thumbnails.length-1].url,
      len: songInfo.videoDetails.lengthSeconds,
      id: songInfo.videoDetails.videoId
  };
  


  if (!squeue) {
      const queueConstruct = {
          channel: message.channel,
          voiceChannel: voicec,
          connection: null,
          songs: [],
          volume: 5,
          playing: true,
          dispatcher: "",
          vol: 0.6,
          seek: 0,
          guildName: message.guild.name,
          guildID: message.guild.id
      };

      queue.set(message.guild.id, queueConstruct);

      queueConstruct.songs.push(song);

      try {
          var connection = await voicec.join();
          queueConstruct.connection = connection;
          playSong(message.guild.id, queueConstruct.songs[0]);
      } catch (err) {
          console.log(err);
          queue.delete(message.guild.id);
          return message.channel.send(err);
      }
  } else {
      squeue.songs.push(song);
      console.log("squeue.songs in process play:" + squeue.songs);
      message.channel.send("added `" + song.title + "` to queue at position " + squeue.songs.length);
  }
}


function skip(message, squeue) {
	if (!message.member.voice.channel) return message.channel.send('Trying to skip the music outside of the voice chat? That\'s not very cash money of you.');
  if (!squeue) return message.channel.send('no songs to skip (i.e. last song in queue)');
  if(squeue){
    if(squeue.dispatcher){
     squeue.dispatcher.end();
    }
  }
}

function dc(message, squeue) { //most likely a good idea to check if the user is actually in the vc of the bot
    if (!message.member.voice.channel) return message.channel.send('Trying to stop the music outside of the voice chat? That\'s not very cash money of you.');
    if(squeue){
      squeue.songs = [];
      if(squeue.dispatcher){
      squeue.dispatcher.end();
      }
      squeue.voiceChannel.leave();
    }
    queue.delete(message.guild.id);
}


function pause(message, squeue){
  if(squeue){
    squeue.dispatcher.pause();
    squeue.playing = false;
    message.reply("paused");
  }
  else{
    message.reply("nothing in queue");
  }
}

function resume(message, squeue){
  if(squeue){
    squeue.dispatcher.resume();
    squeue.playing = true;
    message.reply("resumed");
  }
  else{
    message.reply("nothing in queue");
  }
}


function playSong(guild, song, seeksec = 0) {
	const serverQueue = queue.get(guild);

	if (!song) {
    if(serverQueue){
        if(serverQueue.voiceChannel){
            serverQueue.voiceChannel.leave();
        }
      }
	queue.delete(guild);
	return;
    }
  if(!song.url || song.url === undefined || song.url == "" || song.url == 0 || typeof song.url == undefined || typeof song.url === undefined){
    serverQueue.channel.send("For some reason, it won't let me play this song right now");
    return;
  }
  console.log("song.url: " + song.url);
  var url = "";
  url = song.url;
  if(typeof url == undefined){
    serverQueue.channel.send("For some reason, it won't let me play this song right now");
    return;
  }
  console.log("Seek Seconds: " + seeksec + "s");
	serverQueue.dispatcher = serverQueue.connection.play(ytdl(url, {quality: 'highestaudio', highWaterMark: 1<<25, begin: seeksec + "s"}), {highWaterMark: 1}) //the seeksec is what the seek command is used for, since this is the only place you can actually seek, barely works
		.on('finish', () => {
      if(serverQueue.songs[0]){
       console.log('Music ended! Song was: ' + serverQueue.songs[0].url); 
      }
      serverQueue.songs.shift();
      playSong(guild, serverQueue.songs[0], serverQueue.seek);
      serverQueue.seek = 0;
      if(serverQueue.songs[0]){
        np(serverQueue.channel, serverQueue);
      }
		})
		.on('error', error => {
      console.log("error on playSong: " + error);
      serverQueue.dispatcher.end();
    });
    if(serverQueue.vol == undefined){
      serverQueue.vol = 0.6;
    }
    serverQueue.dispatcher.setVolume(serverQueue.vol); //i really dont know why setting the volume of the bot is paid for most music bots
    if(!serverQueue.playing){
      serverQueue.playing = true;
      serverQueue.dispatcher.resume();
    }
    
}

function setSeek(message, squeue){ //sets the seek by essentially duplicating the song so its next in queue, ending the song then setting the seek with ytdl
  if(!squeue){
    message.reply("Nothing in queue");
    return;
  }
  else{
    var seek = parseInt(message.content.split(" ")[2]);
    if(Number.isInteger(parseInt(seek))){
        if(seek >= 0 && parseInt(seek) <= parseInt(squeue.songs[0].len)){
          squeue.songs.unshift(squeue.songs[0]);
          squeue.seek = seek;
          skip(message, squeue);
        }
        else{
          message.reply("shorter than song or longer than song: len: " + (seek <= squeue.songs[0].len ? "t" : "f") + squeue.songs[0].len + " , seek: " + (seek + seek >= 0 ? "t" : "F"));
        }
    }
    else{
      message.reply("not integer");
    }
  }
}


async function np(channel, squeue){
    if(squeue){
        if(squeue.songs){
          channel.send({
            embed: new Discord.MessageEmbed().setTitle("Now Playing").setDescription(squeue.songs[0].title + "\n" + toTime(squeue.dispatcher.streamTime/1000) + " / " + toTime(squeue.songs[0].len)).setColor("#" + Math.floor(Math.random() * 255).toString(16) + Math.floor(Math.random() * 255).toString(16) + Math.floor(Math.random() * 255).toString(16)).setURL(squeue.songs[0].url).setThumbnail(squeue.songs[0].img).setFooter(squeue.songs.length-1 + " songs left in queue")
          });
        }
    }
    else{
        channel.send("nothings playing");
    }
}

async function showQueue(message, squeue, download = 1){
    if(squeue){
        let page = message.content.split(" ")[2];
        if(page == undefined){
          page = "1";
        }
        if(!Number.isInteger(parseInt(page))){
          message.reply("Page isn't number!");
          return;
        }
        if(page*10 > squeue.songs.length+10){
          message.reply("There aren't that many pages");
          return;
        }

        page = parseInt(page);

        messagetosend = "";
        for(var i = parseInt(page-1)*10-(page == 1 ? 0 : 1); i < (squeue.songs.length > 10*page ? 10*page : squeue.songs.length); i++){
            messagetosend += (i == 0 ? "Now Playing:\n" : "") + (i+1) + ": " + squeue.songs[i].title + " (" + toTime(squeue.songs[i].len) + ") (" + squeue.songs[i].url + ")\n\n";
        }
        
        message.channel.send({
          embed: new Discord.MessageEmbed().setTitle("Queue: " + squeue.songs.length + " songs").setDescription(messagetosend).setFooter("Page " + page + "/" + Math.ceil(squeue.songs.length/10)).setColor("#24dfdf")
        });
    }
    else{
        message.channel.send("nothing in queue");
    }
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function shuffleSongs(message, squeue){
    if(squeue){
        song = squeue.songs[0];
        squeue.songs = shuffle(squeue.songs.splice(1));  
        squeue.songs.unshift(song);
        message.reply("shuffle shuffle...");
    }
    else{
        message.reply("nothing to shuffle");
    }
}

function toTime(seconds){
  return Math.floor(seconds/60) + ":" + (seconds%60 < 10 ? ("0" + seconds%60) : seconds%60);
}



function createPlaylist(squeue, message){
   if (!squeue) {
      message.reply("There are no songs in the queue to make a playlist out of");
   }
   else{
      let title = message.content.substr(23); 
      title = title.replace(/\W/g, ' ');
      if(title == ""){ message.reply("Title is blank! Add your title after the command"); return; }
      con.query("INSERT INTO playlists (guild, creator, title, videos) VALUES ('" + message.guild.id + "', '" + message.author.id + "', \"" + title + "\", \"" + implodeSongs(squeue.songs) + "\");", function (err, result){
        if (err) throw err;
        message.reply("Created new playlist `" + title + "`. Use the command `alexa, playlist " + result.insertId + "`");
      });
   }
}

function playPlaylist(squeue, message){
  var voicec;
  if (message.member.voice.channel) {
      voicec = message.member.voice.channel;
  }
  else{
      message.reply("How can I play despacito if you despaciaren't in a voice chat");
      return 0;
  }
  const permissions = voicec.permissionsFor(message.client.user);
if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
  return message.channel.send('How am I supposed to play despacito if I despacican\'t join or speak in a voice chat?');
}
    var pid = message.content.substr(16);
    if(Number.isInteger(parseInt(pid))){

    con.query("SELECT * FROM playlists WHERE id = " + pid + ";", async function (err, result){
      if(result.length > 0){
          var ids = result[0].videos.split("*");
          message.channel.send("Adding songs to queue");
          var tempsongs = [];
          for(var i = 0; i < ids.length-1; i++){
            var extra = ids[i].split("@");
            var song = {
                         title: extra[0],
                         url: extra[1],
                         img: extra[2],
                         len: extra[3],
                         id: extra[4]
           };
           tempsongs.push(song);
          }
            
            if (!squeue) {
              const queueConstruct = {
                  channel: message.channel,
                  voiceChannel: voicec,
                  connection: null,
                  songs: [],
                  volume: 5,
                  playing: true,
                  seek: 0,
                  guildName: message.guild.name,
                  guildID: message.guild.id
              };

              queue.set(message.guild.id, queueConstruct);

              queueConstruct.songs = queueConstruct.songs.concat(tempsongs);

              try {
                  var connection = await voicec.join();
                  queueConstruct.connection = connection;
                  playSong(message.guild.id, queueConstruct.songs[0]);
              } catch (err) {
                  console.log("error on playPlaylist after playing song: " + err);
                  queue.delete(message.guild.id);
                  return message.channel.send(err);
              }
            }
            else{
               squeue.songs = squeue.songs.concat(tempsongs);
            }
            message.channel.send("Added songs to queue!");
      }
      else{
        message.reply("Not a playlist ID");
      }
    });
    }
    else{
      message.reply("Not a playlist ID");
    }
}

function implodeSongs(songs){
  var str = "";

  for(var i = 0; i < songs.length; i++){
    str += songs[i].title + "@" + songs[i].url + "@" + songs[i].img + "@" + songs[i].len + "@" + songs[i].id;
    str += "*";
  }
  return mysql_real_escape_string(str);
}

function findPlaylists(message){
    let type = message.content.split(" ")[2];
    if(type == undefined){
      type = "guild";
    }
    else{
      if(type == "m" || type == "mine" || type == "creator"){
        type = "creator";
      }
      else if(type == "g" || type == "guild"){
        type = "guild";
      }
      else{
        message.reply("Not a type parameter");
        return;
      }
    }
    con.query("SELECT * FROM playlists WHERE " + type + " = " + (type == "guild" ? message.guild.id : message.author.id) + ";", function(err, result){
      if(err) throw err;
      if(result.length > 0){
      let page = message.content.split(" ")[3];
        if(page == undefined){
          page = "1";
        }
        if(!Number.isInteger(parseInt(page))){
          message.reply("Page isn't number!");
          return;
        }
        if(page*10 > result.length+10){
          message.reply("There aren't that many pages");
          return;
        }

        page = parseInt(page);

        var messagetosend = "";
        for(var i = parseInt(page-1)*10-(page == 1 ? 0 : 1); i < (result.length > 10*page ? 10*page : result.length); i++){
            var res = result[i].videos.split("*").length-1;
            messagetosend += "ID: " + result[i].id + ": " + result[i].title + " by " + bot.users.cache.get(result[i].creator).username + " (" + res + " songs)\n\n";
        }
        
        message.channel.send({
          embed: new Discord.MessageEmbed().setTitle("Playlists " + (type == "guild" ? "On Guild" : "By You")).setDescription(messagetosend).setFooter("Page " + page + "/" + Math.ceil(result.length/10)).setColor("#24dfdf")
        });
      }
      else{
        message.reply("No results");
      }
    }); 
}

function remove(message, squeue){
  if(!squeue){
    message.channel.send("Nothing in queue to remove");
    return;
  }
  else{
    if(squeue.songs.length < 2){
      skip(message, squeue);
      return;
    }
    else{
      var index = message.content.split(" ")[2];
      if(Number.isInteger(parseInt(index))){
        if(squeue.songs[index-1]){
          message.channel.send("Removed `" + squeue.songs[index-1].title + "` from index " + index);
          squeue.songs.splice(index-1, 1);
        }
        else{
          message.reply("Index doesn't exist");
        }
      }
      else{
        message.reply("Index is not a number!");
      }
    }
  }
}


function swapsong(message, squeue){
  if(!squeue){
    message.channel.send("Nothing in queue to move");
  }
  else{
    if(squeue.songs.length < 2){
      message.channel.send("Only one song in queue");
    }
    else{
      var index = message.content.split(" ")[2];
      var index2 = message.content.split(" ")[3];
      if(Number.isInteger(parseInt(index))){
        if(squeue.songs[index-1]){
          if(Number.isInteger(parseInt(index2))){
            if(squeue.songs[index2-1]){
              var tempsong = squeue.songs[index-1];
              squeue.songs[index-1] = squeue.songs[index2-1];
              squeue.songs[index2-1] = tempsong;
              message.channel.send("Swapped `" + squeue.songs[index-1].title + "` and `" + squeue.songs[index2-1].title +"`");
            }
            else{
              message.reply("Index 2 doesn't exist");
            }
          }
          else{
            message.reply("Index 2 isn't a number");
          }
        }
        else{
          message.reply("Index 1 doesn't exist");
        }
      }
      else{
        message.reply("Index 1 isn't a number");
      }
    }
  }
}


function mysql_real_escape_string (str) { //pretty cool stackoverflow code right here
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
      switch (char) {
          case "\0":
              return "\\0";
          case "\x08":
              return "\\b";
          case "\x09":
              return "\\t";
          case "\x1a":
              return "\\z";
          case "\n":
              return "\\n";
          case "\r":
              return "\\r";
          case "\"":
          case "'":
          case "\\":
          case "%":
              return "\\"+char; // prepends a backslash to backslash, percent,
                                // and double/single quotes
          default:
              return char;
      }
  });
}


function volume(message, squeue){
  squeue = queue.get(message.guild.id);
  if(!squeue){
    message.reply("Nothing in queue");
    return;
  }
  else{
    var volume = message.content.split(" ")[2];
    if(Number.isInteger(parseInt(volume))){
        if(volume >= 0 && volume <= 500){
          squeue.dispatcher.setVolume(volume/100);
          squeue.vol = volume/100;
          queue.set(message.guild.id, squeue);
        }
  }
}
}

async function playlistInfo(message){
    var id = message.content.split(" ")[2];
    if(Number.isInteger(parseInt(id))){
      con.query("SELECT * FROM playlists WHERE id = " + id + ";", async function (err, result){
        if(err) console.error(err);
        if(result.length > 0 || result[0]){
          if(parseInt(result[0].guild) == message.guild.id || message.author.id == parseInt(result[0].creator) || message.author.id == 341561258480238592){
            let page = message.content.split(" ")[3];
            if(page == undefined){
              page = "1";
            }
            if(!Number.isInteger(parseInt(page))){
              message.reply("Page isn't number!");
              return;
            }
            songs = result[0].videos.split("*");
            if(page*10 > songs.length+10){
              message.reply("There aren't that many pages");
              return;
            }

            page = parseInt(page);

            messagetosend = "";
            for(var i = parseInt(page-1)*10-(page == 1 ? 0 : 1); i < (songs.length-1 > 10*page ? 10*page : songs.length-1); i++){ //the absolute best way to set the range of i by page
                songinfo = songs[i].split("@");
                messagetosend += i+1 + ": " + songinfo[0] + " (" + toTime(songinfo[3]) + ") (" + songinfo[1] + ")\n\n";
            }
            var info = await bot.users.cache.get(result[0].creator);
            if(!info){
              info = {username: "(username could not be cached)"}; //sometimes, the username is not in the bot cache as discord.js v12 made *everything* a cache and you cant look up a username anymore
            }
            message.channel.send({
              embed: new Discord.MessageEmbed().setTitle(result[0].title + " by " + info.username).setDescription(messagetosend).setFooter("Page " + page + "/" + Math.ceil(songs.length/10)).setColor("#ffff00")
            });
          }
          else{
            message.reply("This playlist isn't from your guild/server or this playlist is not yours and isn't from this guild/server.");
          }
        }
        else{
          message.reply("Not a playlist ID");
        }
      });
    }
    else{
      message.reply("Not a playlist ID");
    }
}


function updatePlaylist(squeue, message){
  if (!squeue) {
    message.reply("There are no songs in the queue to make a playlist out of");
 }
 else{
    var id = message.content.split(" ")[3];
    if(Number.isInteger(parseInt(id))){
      con.query("SELECT * FROM playlists WHERE id = " + id + ";", function (err, result){
        if(err) console.error(err);
        if(result.length > 0){
          if(message.author.id == parseInt(result[0].creator)){
          con.query("UPDATE playlists SET videos = \"" + implodeSongs(squeue.songs) + "\" WHERE id = " + id + ";", function (err, result){
            if (err) throw err;
            message.reply("Updated playlist. Use the command `alexa, playlist " + id + "`");
          });
        }
        else{
          message.reply("This isn't your playlist!");
        }
        }
        else{
          message.reply("Not a playlist ID");
        }
      });
    }
    else{
      message.reply("Not a playlist ID");
    }
    
 }
}



//auto generate a playlist, take the top 50 results of a search result and then put it in the queue
function autogen(squeue, message){
  var voicec;
  if (message.member.voice.channel) {
      voicec = message.member.voice.channel;
  }
  else{
      message.reply("How can I play despacito if you despaciaren't in a voice chat");
      return 0;
  }
  const permissions = voicec.permissionsFor(message.client.user);
if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
  return message.channel.send('How am I supposed to play despacito if I despacican\'t join or speak in a voice chat?');
}
var query = message.content.substr(12);
youtube.search.list({
  part: "snippet",
  q: query,
  maxResults: 50
}).then(async function(response) {
          var tempsongs = [];
          message.reply("Adding songs into queue. Since I'm auto generating this, it might take much longer than usual while the data that is needed will be downloaded");
          for(var i = 0; i < response.data.items.length; i++){
            if(response.data.items[i].snippet.title == "Deleted video"){
              i++;
            }
            var id = response.data.items[i].id.videoId;
            if(id === undefined || id === ""){
              id = "dQw4w9WgXcQ"; //if the id somehow just didn't exist, this is the proper way to signal that
            }
            else{
            const songInfo = await ytdl.getBasicInfo("https://youtube.com/watch?v=" + id).catch(console.log("ytdl do be stupid"));

            const song = {
                title: songInfo.videoDetails.title,
                url: "https://youtube.com/watch?v=" + id,
                img: songInfo.player_response.videoDetails.thumbnail.thumbnails[songInfo.player_response.videoDetails.thumbnail.thumbnails.length-1].url,
                len: songInfo.videoDetails.lengthSeconds,
                id: songInfo.videoDetails.videoId
            };
           tempsongs.push(song);
          }
          
          }

  if (!squeue) {
    const queueConstruct = {
        channel: message.channel,
        voiceChannel: voicec,
        connection: null,
        songs: [],
        volume: 5,
        playing: true,
        seek: 0,
        guildName: message.guild.name,
        guildID: message.guild.id
    };

    queue.set(message.guild.id, queueConstruct);

    queueConstruct.songs = queueConstruct.songs.concat(tempsongs);

    try {
        var connection = await voicec.join();
        queueConstruct.connection = connection;
        playSong(message.guild.id, queueConstruct.songs[0]);
    } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send(err);
    }
  }
  else{
     squeue.songs = squeue.songs.concat(tempsongs);
  }
  message.channel.send("Added songs to queue!");
}).catch( /* idk error stuff, never got to this point */ );
}


function repeatSong(message, squeue){
  if(!squeue){
    message.channel.send("Nothing in queue to repeat");
  }
  else{

      var index = message.content.split(" ")[3];
      var repeatS = message.content.split(" ")[4];
      if(Number.isInteger(parseInt(repeatS))){
        if(parseInt(repeatS) > 0){
          if(Number.isInteger(parseInt(index))){
            if(squeue.songs[index-1]){
              for(var i = 0; i < parseInt(repeatS); i++){
                squeue.songs.push(squeue.songs[index-1]);
              }
              message.reply("Added `" + squeue.songs[index-1].title + "` to queue " + repeatS + " more times");
            }
            else{
              message.reply("Song Index doesn't exist");
            }
          }
          else{
            message.reply("Song Index isn't a number");
          }
        }
        else{
          message.reply("You cant repeat a song " + parseInt(repeatS) + " times");
        }
      }
      else{
        message.reply("Repeat number isn't a number");
      }
    }
}
