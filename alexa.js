const Discord = require("discord.js");
const bot = new Discord.Client();
const ytdl = require('ytdl-core');
const fs = require('fs');
const yt = require('simpleyt');
const deepspeech = require("deepspeech"); //you dont need this if you dont have voice commands enabled
var mysql = require("mysql"); //you dont need this if you dont have playlists enabled
const { isNumber } = require("lodash");


//enable and disable certain functions of the bot
const enableMysql = true;
const enableVoice = true;
const enableSpotify = true;
const enableTwitch = true;




if(enableMysql == true){
  var db_config = {
    host: "",
    user: "",
    password: "",
    database: ""
  };


  function handleDisconnect() {
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
}

if(enableVoice == true){
  const Sox = require('sox-stream');
  const MemoryStream = require('memory-stream');
  const Duplex = require('stream').Duplex;
}

if(enableSpotify == true){
  var SpotifyWebApi = require('spotify-web-api-node');
  var spotifyApi = new SpotifyWebApi({
    clientId: '', //insert client id here from spotify
    clientSecret: '' //insert client secret from spotify
  });

  spotifyGetToken();
}



if(enableTwitch == true){ //yea i just copy and pasted from the example


const opts = {
  identity: {
    username: "", //your channel name
    password: "" //get the oauth code from twitch or some other oauth code generator website
  },
  channels: [
    "" //channel name
  ]
};

const songRequestChannel = ""; //put the discord channel that will recieve the song requests from twitch chat
const discordGuild = ""; //the discord server/guild to get the queue of song from


  // Create a client with our options
  const client = new tmi.client(opts);
  //twitch integration
  client.on('message', onMessageHandler);
  client.on('connected', onConnectedHandler);

  // Connect to Twitch:
  client.connect();

  // Called every time a message comes in
  function onMessageHandler (target, context, msg, self) {
    if (self) { return; } // Ignore messages from the bot

    // Remove whitespace from chat message
    const commandName = msg;

    // If the command is known, let's execute it
    if (commandName.startsWith('!song')) {
      const serverQueue = queue.get(discordGuild);

      if(serverQueue){
        client.say(target, serverQueue.songs[0].title + " is currently playing");
      }
      else{
        client.say(target, "Nothing is playing currently");
      }
      console.log(`* Executed ${commandName} command`);
    }

    if(commandName.startsWith("!req")){
      var words = commandName.split(" ");
      if(words.length == 1){
        client.say(target, "Request a song to be played. I might not play it, I might. More of a chance I'll play if you put a link. If you spam this, you'll be timed out and eventually banned.");
      }
      else{
        words.shift();
        bot.channels.cache.find(c => c.id == songRequestChannel).send({embed: new Discord.MessageEmbed().setTitle("Song Request By " + context.username).setDescription("Song is\n" + words.join(" ")).setFooter("Make sure to ban if inappropriate or they spammed!")});
        client.say(target, "Request Sent");
      }
    }
  }

  function onConnectedHandler (addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
  }
}




bot.login('bot token here'); //discord bot token goes here (required)








var queue = new Map(); //the huge list of server queues



bot.on('message', message =>{


    queue.forEach(value => {
      if(!message.guild.me.voice.channel){
        if(value.guildID == message.guild.id){
          console.log("Deleted queue due to manual disconnect: " + value.guildName + " (" + value.guildID + ")");
          queue.delete(message.guild.id);
        }
      }
    });

    let command = message.content.toLowerCase();
    if (!message.guild) return;

    const serverQueue = queue.get(message.guild.id);

    if(command.startsWith("alexa, play ")){
      if(command.startsWith("alexa, play https://youtube") || command.startsWith("alexa, play https://youtu.be")){
        playurl(message, serverQueue);
      }
      else if(command.startsWith("alexa, play https://open.spotify.com/playlist/")){
        if(enableSpotify){
          spotifyPlaylist(message, serverQueue);
        }
        else{
          message.reply("Sorry, the bot owner doesn't have spotify enabled");
        }
      }
      else if(command.startsWith("alexa, play https://open.spotify.com/track/")){
        if(enableSpotify){
          spotifyTrack(message, serverQueue);
        }
        else{
          message.reply("Sorry, the bot owner doesn't have spotify enabled");
        }
      }
      else{
        play(message, serverQueue);
      }
    }
    if(command.startsWith("alexa, search")){
        search(message, serverQueue);
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
      if(enableMysql){
        createPlaylist(serverQueue, message);
      }
      else{
        message.reply("Sorry, the bot owner doesn't have playlists enabled");
      }
    }
    if(command.startsWith("alexa, playlist")){
      if(enableMysql){
        playPlaylist(serverQueue, message);
      }
      else{
        message.reply("Sorry, the bot owner doesn't have playlists enabled");
      }
    }
    if(command.startsWith("alexa, find")){
      if(enableMysql){
        findPlaylists(message);
      }
      else{
        message.reply("Sorry, the bot owner doesn't have playlists enabled");
      }
    }
    if(command.startsWith("alexa, remove") || command.startsWith("alexa, eliminate")){
        remove(message, serverQueue);
    }
    if(command.startsWith("alexa, swap")){
        swapsong(message, serverQueue);
    }
    if(command.startsWith("alexa, pause")){
        pause(message, serverQueue);
    }
    if(command.startsWith("alexa, resume") || command.startsWith("alexa, keep the ball") || command.startsWith("alexa, the ball") || command.startsWith("alexa, unpause")){
        resume(message, serverQueue);
    }
    if(command.startsWith("alexa, vol")){
        volume(message, serverQueue);
    }
    if(command.startsWith("alexa, info")){
      if(enableMysql){
        playlistInfo(message);
      }
      else{
        message.reply("Sorry, the bot owner doesn't have playlists enabled");
      }
    }
    if(command.startsWith("alexa, update playlist")){
      if(enableMysql){
        updatePlaylist(serverQueue, message);
      }
      else{
        message.reply("Sorry, the bot owner doesn't have playlists enabled");
      }
    }
    if(command.startsWith("alexa, seek")){
      setSeek(message, serverQueue);
    }
    if(command.startsWith("alexa, loop song")){
      loopSong(message, serverQueue);
    }
    if(command.startsWith("alexa, loop queue")){
      loopQueue(message, serverQueue);
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
          .setDescription(`alexa, help - The help section
          \nalexa, play - searches YouTube with the query, or plays a link
          \n*new!* alexa, search - searches by a query, top 5 search results that you can pick from and add to queue
          \nalexa, dc - Disconnect from voice channel
          \nalexa, skip - skips the song
          \nalexa, np - shows what playing right now
          \nalexa, queue [page number] - shows the queue. Put the page number if the queue is long than 10
          \nalexa, shuffle - shuffles the songs
          \nalexa, create playlist [playlist name] - creates a new playlist that anyone in the guild and you can use, songs taken from queue
          \nalexa, playlist [playlist ID] - adds all songs in a playlist to the queue with the playlist ID
          \nalexa, find [g | m] - finds playlist from your guild (g) or from you (m)
          \nalexa, info [playlist ID] [page]- shows info about playlist
          \nalexa, update playlist [ID] - updates your playlist with the songs in the queue
          \nalexa, remove [index] - removes a song from the queue with the index
          \nalexa, swap [index 1] [index 2] - swaps 2 songs in a queue by their index
          \nalexa, pause - pause\nalexa, resume - resume
          \nalexa, vol - set the volume (0-100)
          \nalexa, auto [query] - auto generates the top 50 search results from YouTube
          \nalexa, repeat song [index] [amount] - repeats a song/video from the queue [amount] times.
          \nalexa, loop song - loops the current song thats playing, toggle it with this command.
          \nalexa, loop queue - loops the queue, toggle with command
          \nalexa, invite - invite to bot, although once I'm in 20 servers, no more invites! (im broke)`)
          })
    }



    if(command.startsWith("alexa, listen")){
      if(enableVoice){
        if(serverQueue){
          message.reply("listening");
          stt(serverQueue, message);
        }
        else{
          message.reply("get in a vc with some music");
        }
      }
      else{
        message.reply("Sorry, the bot owner doesn't have voice commands enabled");
      }
    }

});

function stt(serverQueue, message) {
    var model = new deepspeech.Model("model.pbmm"); //your model file
    model.enableExternalScorer("model.scorer"); //your scorer file 
    const channels = 2;
    let stream = model.createStream();
    var readable = serverQueue.connection.receiver.createStream(message.author, { mode: "pcm", end: "silence"});
    var chunks = Buffer.alloc(0);



    var ended = false;
    var numSoundedChunks = 0;

    readable.on('data', chunk => {
        numSoundedChunks++;
        if(numSoundedChunks > 250){
          readable.end();
          readable.destroy();
          console.log("ending");
        }
        chunks = Buffer.concat([chunks, chunk], chunks.length + chunk.length);
    });
    readable.on('close', () => {
      if(ended == false){
      var wav = require('wav');
      var writer = new wav.FileWriter("./voice/" + message.id + '.wav', {
        sampleRate: 48000,
        channels: 2,
        bitDepth: 16
      });
      writer.write(chunks); //todo make sure this is not sync
      writer.end();
      setTimeout(() => {
        fs.readFile("./voice/" + message.id + ".wav", (err, data) => {
          if (err) {
            console.error(err)
            return
          }
        const desiredSampleRate = model.sampleRate();
        const wavfile = require("wav-file-info");
          wavfile.infoByFilename("./voice/" + message.id + '.wav', function(err, info){
              if (err) return;
            //  console.log(info);
            let audioStream = new MemoryStream();
            bufferToStream(data).
              pipe(Sox({
                input: {
                  volume: 0.5
                },
                global: {
                  'no-dither': true,
                },
                output: {
                  bits: 16,
                  rate: desiredSampleRate,
                  channels: 1,
                  encoding: 'signed-integer',
                  endian: 'little',
                  compression: 0.0,
                  type: 'raw'
                }
              })).
              pipe(audioStream);

            audioStream.on('finish', async () => {
              let audioBuffer = audioStream.toBuffer();
              let result = model.stt(audioBuffer);
              deepspeech.FreeModel(model);
              console.log("result:" + result);
              if (result.search("play") != -1 || result.search("lay") != -1) {

                var songToPlay = result.substr(result.indexOf("lay") + 3);
            //  const say = require("say"); //i did not get tts to work :(
                message.content = "alexa, play " + songToPlay;
                message.reply("hopefully i got it right, here's what I translated: `" + songToPlay + "`");
                play(message, serverQueue);
              }
              else if (result.search("skip") != -1 || result.search("next") != -1) {
                skip(message, serverQueue);
              }
              else if (result.search("shuffle") != -1 || result.search("mix it") != -1 || result.search("random") != -1){
                shuffleSongs(message, serverQueue);
              }
              else if(result.search("remove") != -1 || result.search("go back") != -1){
                serverQueue.songs.pop();
                message.reply("ok ok i guess i fucked up ok im not perfect");
              }
              else if(result.search("disconnect") != -1 || result.search("leave") != -1){
                dc(message, serverQueue);
                message.reply("ight imma head out");
              }
              else if(result.search("loop") != -1){
                loopSong(message, serverQueue);
                message.reply("toggle looping song");
              }
              if(serverQueue.listening == true){
                stt(serverQueue, message);
              }
              else{
                console.log("stopped");
                return;
              }

          });
        });
      });
      }, 1500);
    }
    });
}

function bufferToStream(buffer) {
  var stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}



function spotifyGetToken() {
  if(enableSpotify){
    spotifyApi.clientCredentialsGrant().then(
      function (data) {
        console.log('The access token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);

        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);
      },
      function (err) {
        console.log('Something went wrong when retrieving an access token', err);
      }
    );
  }
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
    if(query == "despacito"){
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
            message.reply("The query did not give any results. If it's a youtube link, make sure it's in this format `https://www.youtube.com/watch?v=dQw4w9WgXcQ`.\nIf it's a spotify playlist, use this format `https://open.spotify.com/playlist/...`.\nIf it's a spotify track, use this format `https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=e7e9bf391db94cff`");
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
       var vid = message.content.substr(12);
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
  //playerConfig = false; //check if failed to fetch
  const songInfo = await ytdl.getBasicInfo(vid); //sometimes error, could not find playing config

  const song = {
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
          guildID: message.guild.id,
          loop: 0,
          listening: true
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
  if (!squeue) return message.channel.send('no songs to skip (ie last song in queue)');
  if(squeue){
    if(squeue.dispatcher){
      console.log("fuck me");
     squeue.dispatcher.end();
    }
  }
}

function dc(message, squeue) {
    if (!message.member.voice.channel) return message.channel.send('Trying to stop the music outside of the voice chat? That\'s not very cash money of you.');
    if(squeue){
      squeue.songs = [];
      if(squeue.dispatcher){
      squeue.dispatcher.end();
      }
      squeue.voiceChannel.leave();
      squeue.listening = false;
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
	serverQueue.dispatcher = serverQueue.connection.play(ytdl(url, {quality: 'highestaudio', highWaterMark: 1<<25, begin: seeksec + "s"}), {highWaterMark: 1})
		.on('finish', () => {
      if(serverQueue.songs[0]){
       console.log('Music ended! Song was: ' + serverQueue.songs[0].url + " on " + serverQueue.guildName + " (" + serverQueue.guildID + ")");
      }
      if(serverQueue.loop == 0){
        serverQueue.songs.shift();
      }
      if(serverQueue.loop == 2){
        var songplaceholder = serverQueue.songs[0];
        serverQueue.songs.shift();
        serverQueue.songs.push(songplaceholder);
      }
      playSong(guild, serverQueue.songs[0], serverQueue.seek);
      serverQueue.seek = 0;
      if(serverQueue.songs[0]){
        np(serverQueue.channel, serverQueue);
      }
		})
		.on('error', error => {
      console.log("error on playSong: " + error);
   //   serverQueue.channel.send("There seems to be an error on my part: ```" + error + "``` If you want to, you can report this to the alexa, play despacito's Support Server. You can join by typing the command `alexa, support server`\n\nSkipping song...");
      serverQueue.dispatcher.end();
    });
    if(serverQueue.vol == undefined){
      serverQueue.vol = 0.6;
    }
    serverQueue.dispatcher.setVolume(serverQueue.vol);
    if(!serverQueue.playing){
      serverQueue.playing = true;
      serverQueue.dispatcher.resume();
    }
    
}

function setSeek(message, squeue){
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
            embed: new Discord.MessageEmbed().setTitle("Now Playing" + (squeue.loop == 1 ? " | Song On Loop" : (squeue.loop == 2 ? " | Queue On Loop" : ""))).setDescription(squeue.songs[0].title + "\n" + toTime(squeue.dispatcher.streamTime/1000) + " / " + toTime(squeue.songs[0].len)).setColor("#" + Math.floor(Math.random() * 255).toString(16) + Math.floor(Math.random() * 255).toString(16) + Math.floor(Math.random() * 255).toString(16)).setURL(squeue.songs[0].url).setThumbnail(squeue.songs[0].img).setFooter(squeue.songs.length-1 + " songs left in queue")
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
          embed: new Discord.MessageEmbed().setTitle("Queue: " + squeue.songs.length + " songs" + (squeue.loop == 1 ? " | Current Song On Loop" : (squeue.loop == 2 ? " | Queue On Loop" : ""))).setDescription(messagetosend).setFooter("Page " + page + "/" + Math.ceil(squeue.songs.length/10)).setColor("#24dfdf")
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
  if(enableMysql){
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
}

function playPlaylist(squeue, message){
  if(enableMysql){
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
    var shuffle = false;
    var pid = "not a playlist";
    if(message.content.split(" ").length > 2){
      var pid = message.content.split(" ")[2];
    }
    if(message.content.split(" ").length > 4){
      shuffle = true;
    }
    if(Number.isInteger(parseInt(pid))){

    con.query("SELECT * FROM playlists WHERE id = " + pid + ";", async function (err, result){
      if(result.length > 0){
      //  if(parseInt(result[0].guild) == message.guild.id || message.author.id == parseInt(result[0].creator)){
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
                  guildID: message.guild.id,
                  loop: 0,
                  listening: true
              };

              queue.set(message.guild.id, queueConstruct);
              queueConstruct.songs = queueConstruct.songs.concat(tempsongs);
              queueConstruct.songs = queueConstruct.songs.sort(() => Math.random() - 0.5);

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
      //  }
      //  else{
      //      message.reply("This playlist isn't from your guild/server or this playlist is not yours and isn't from this guild/server.");
       // }
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

function implodeSongs(songs){
  var str = "";

  for(var i = 0; i < songs.length; i++){
    
    str += songs[i].title.replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '') + "@" + songs[i].url + "@" + songs[i].img + "@" + songs[i].len + "@" + songs[i].id;
    str += "*";
  }
  return mysql_real_escape_string(str);
}

function findPlaylists(message){
  if(enableMysql){
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


function mysql_real_escape_string (str) { 
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
  if(enableMysql){
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
            for(var i = parseInt(page-1)*10-(page == 1 ? 0 : 1); i < (songs.length-1 > 10*page ? 10*page : songs.length-1); i++){
                songinfo = songs[i].split("@");
                messagetosend += i+1 + ": " + songinfo[0] + " (" + toTime(songinfo[3]) + ") (" + songinfo[1] + ")\n\n";
            }
            var info = await bot.users.cache.get(result[0].creator);
            if(!info){
              info = {username: "(username could not be cached)"};
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
}


function updatePlaylist(squeue, message){
  if(enableMysql){
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
              if(parseInt(repeatS) > 1000){
                repeatS = "1000";
              }
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


function loopSong(message, squeue){
  if(!squeue){
    message.channel.send("Nothing in queue to loop");
  }
  else{
    if(squeue.loop != 0){
      squeue.loop = 0;
      message.channel.send("Stopped looping song");
    }
    else{
      squeue.loop = 1;
      message.channel.send("Looping song: " + squeue.songs[0].title);
    }
  }
}


function loopQueue(message, squeue){
  if(!squeue){
    message.channel.send("Nothing in queue to loop");
  }
  else{
    if(squeue.loop != 0){
      squeue.loop = 0;
      message.channel.send("Stopped looping queue");
    }
    else{
      squeue.loop = 2;
      message.channel.send("Looping queue");
    }
  }
}


function search(message, squeue){
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
  let query = command.substr(13);
  var yid = "";
  if(query == "despacito"){
    yid = "kJQP7kiw5Fk";
    processPlay(squeue, "https://youtube.com/watch?v=kJQP7kiw5Fk", message, voicec);
  }
  else{
   yt(query).then(result => {
      if(result){
        if(result[0]){
          yid = result[0].identifier;
          var vid = "https://www.youtube.com/watch?v=" + yid;

          var i = 0;
          var messagetosend = "";
          while(result[i] && i < 5){
            messagetosend += (i == 0 ? "Results:\n" : "") + (i+1) + ": " + result[i].title + " (" + toTime(result[i].length.sec) + ") (" + result[i].uri + ")\n\n";
            i++;
          }
          messagetosend += "\n\nSelect one of these by typing in the number";
          message.channel.send({
            embed: new Discord.MessageEmbed().setTitle("Search Results for " + query).setDescription(messagetosend)
          });
          const filter = m => message.author.id === m.author.id;
          message.channel.awaitMessages(filter, { time: 60000, max: 1, errors: ['time'] })
								.then(messages => { 
                  if(isNumber(parseInt(messages.first().content))){
                    vid = result[parseInt(messages.first().content) - 1].uri;
                    processPlay(squeue, vid, message, voicec);
                  }
                  else{
                    message.reply("Make sure to input a number");
                  }
                });

        }
        else{
          message.reply("The query did not give any results. Use alexa, playurl {url} for youtube links.");
          return;
        }

        if(!vid){
          message.reply("seems to be an error, the link was never provided to me from youtube search! not your fault, completely youtube's fault");
          return;
        }
        
        
      }
    });
  }
}


function spotifyPlaylist(message, squeue){
  if(enableSpotify){
  spotifyApi.resetAccessToken();
  spotifyApi.clientCredentialsGrant().then(d => {
    spotifyApi.setAccessToken(d.body['access_token'])
    setTimeout(() => {
      var pid = message.content.substr("alexa, play https://open.spotify.com/playlist/".length);
      if(pid.indexOf("?")){
        pid = pid.substr(0, pid.indexOf("?"));
      }
      console.log(pid);
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

      message.reply("Since this is loading data one by one from youtube (because I can't actually stream from spotify), this might take a while");
      spotifyApi.getPlaylist(pid).then(async data => {
        var tempsongs = [];
        for(var i = 0; i < data.body.tracks.items.length; i++){
          console.log(data.body.tracks.items[i].track.name + " " + data.body.tracks.items[i].track.artists[0].name);
          console.log(i);
          var query = data.body.tracks.items[i].track.name + " " + data.body.tracks.items[i].track.artists[0].name;
          await yt(query).then(async result => {
            if(result){
              if(result[0]){
                console.log(result[0]);
                yid = result[0].identifier;
                var vid = "https://www.youtube.com/watch?v=" + yid; 
                const song = {
                    title: result[0].title,
                    url: result[0].uri,
                    img: result[0].thumbnails[0].url,
                    len: result[0].length.sec,
                    id: yid
                };
                tempsongs.push(song);
              }
              else{
                message.reply("The query did not give any results. If it's a youtube link, make sure it's in this format `https://www.youtube.com/watch?v=dQw4w9WgXcQ`.\nIf it's a spotify playlist, use this format `https://open.spotify.com/playlist/...`.\nIf it's a spotify track, use this format `https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=e7e9bf391db94cff`");
                return;
              }
    
              if(!vid){
                message.reply("seems to be an error, the link was never provided to me from youtube search! not your fault, completely youtube's fault");
                return;
              }
              
            }
          }).catch(err => {
            console.log(err);
          });
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
                guildID: message.guild.id,
                loop: 0,
                listening: true
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
          if(enableMysql){
            message.reply("Since this took a while to create, would you like to create an alexa playlist to access it faster? (yes or no)");
            const filter = m => message.author.id === m.author.id;
            message.channel.awaitMessages(filter, { time: 60000, max: 1, errors: ['time'] })
                  .then(messages => { 
                    if(messages.first().content.startsWith("yes")){
                      message.content = "alexa, create playlist " + data.body.name; 
                      createPlaylist(queue.get(message.guild.id), message);
                    }
                    else{
                      message.reply("Not creating a playlist, you can create a playlist any time with `alexa, create playlist {playlist name}`");
                    }
                  });
          }


      }, err => {
        console.error(err);
        message.reply("uh oh there was an error, check the spotify link! Make sure it's public!");
      });
    }, 500);
  });
}
}




function spotifyTrack(message, squeue){
  if(enableSpotify){
    spotifyApi.resetAccessToken();
    spotifyApi.clientCredentialsGrant().then(d => {
      spotifyApi.setAccessToken(d.body['access_token']);
        var pid = message.content.substr("alexa, play https://open.spotify.com/track/".length);
        if(pid.indexOf("?")){
          pid = pid.substr(0, pid.indexOf("?"));
        }
        spotifyApi.getTrack(pid).then(data =>{
            var query = data.body.name + " " + data.body.artists[0].name;
            yt(query).then(result => {
              if(result){
                if(result[0]){
                  message.content = "alexa, play " + result[0].uri;
                  play(message, squeue);
                }
              }
            });
        });
    });
  }
}
