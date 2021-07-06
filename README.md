# alexa
alexa is now your own music bot, usually playing despacito. But in reality, alexa is a fully featured music bot with lots of features that other music bots just don't have or are paid. Plus of course with the charm of alexa in discord. 
# Features
Alexa has a wide variaty of features. You can create **playlists** (also called saved queues) to play the songs in your queue anytime you want without manaully inputting the songs again. You can search through playlists made on a guild or search your own. If a friend wants to show you a playlist, but isn't in the same server as you, you can just use their playlist ID. **Seek** functionality, although very experimental (if it works is up to the rng of the day), when it does work, it's a very nice feature if you just want to skip to a certain part of a video or song. And of course the regular commands of a music bot, play youtube links, remove indexes, search youtube by query, skip, queue list, volume control (without paying! what a revelation), swap and more. 

Wait did I mention
# Voice Commands
Yes yes, with state of the art technology (open source stuff that was free, thanks Mozilla!), alexa now has voice commands. Sure they aren't the best, but damn it, they work. You can have alexa play songs, skip, disconnect, loop and shuffle. Without even needing to type it in. So now you can game and listen to music, hands free. Plus with discord overlay, you can see what song alexa is playing when you skip!

even 
# Twitch Integration
Chat asking you what song you're playing? Well they can just find out themselves using `!song` in twitch chat. They can also request songs that will be neatly sent to a channel in your server so you can play them or discard them. The request command is `!req {song name/link}`.

plus 
# Spotify
Sure, many other bots have this, but those bots are closed source (how dare they), so now you can rest easy knowing that you're using an open source bot to listen to Spotify, well actually youtube, but still uses spotify to search the songs on youtube by the name of the song that you found on spotify, got it? Yeah, it's just spotify playlists and tracks, what else?

# Commands
- alexa, help - The help section
- alexa, play - plays a link, spotify link or searches the top result on youtube
- alexa, search - searches by a query, top 5 search results that you can pick from and add to queue
- alexa, dc - Disconnect from voice channel
- alexa, skip - skips the song
- alexa, np - shows what's playing right now
- alexa, queue [page number] - shows the queue. Put the page number if the queue is longer than 10
- alexa, shuffle - shuffles the songs
- alexa, create playlist [playlist name] - creates a new playlist that anyone in the guild and you can search for, songs taken from queue
- alexa, playlist [playlist ID] - adds all songs in a playlist to the queue with the playlist ID
- alexa, find [g | m] - finds playlist from your guild (g) or from you (m)
- alexa, info [playlist ID] [page]- shows info about a playlist
- alexa, update playlist [ID] - updates your playlist with the songs in the queue
- alexa, remove [index] - removes a song from the queue with the index
- alexa, swap [index 1] [index 2] - swaps 2 songs in a queue by their index's
- alexa, pause - pause
- alexa, resume - resume
- alexa, vol - sets the volume (0-100)
- alexa, loop song - loops the current song thats playing, toggle it with this command.
- alexa, loop queue - loops the queue, toggle with command
- alexa, repeat song [index] [amount] - repeats a song/video from the queue [amount] times.
- alexa, listen - starts listening for voice commands

# Installation
- You'll need the following packages: `ytdl-core`, `discord.js`, `simpleyt`, `lodash`, all of the packages need to be latest.
- You'll need a mysql server (since the mysql package is a bit outdated, you'll need to enable legacy support in the mysql server setup.), but if you don't care about playlist support, then you don't need this. If you don't care about playlists (which is why the MySQL server is needed), then just make sure that `const enableMysql` is set to false, it's true by default (line 12). 
The mysql table structure is this: `CREATE TABLE playlists (id int NOT NULL AUTO_INCREMENT PRIMARY KEY, guild VARCHAR(50), creator VARCHAR(50), title text, videos mediumtext);`, just input that to your mysql console, and you'll be good to go (make sure to select your database first! `use mysql` or `use {database name}`). More explaination on the reasoning of the structure in the extra notes. 
- If you want to have voice commands, make sure to have `deepspeech` and `sox-stream` also installed. You'll need a model and a scorer. You can get these files on the release page of deepspeech's github (https://github.com/mozilla/DeepSpeech/releases). You'll also have to have sox installed and make sure the PATH variable is set to sox's binaries (http://sox.sourceforge.net/). Otherwise, set `const enableVoice` to false
- If you want to have spotify enabled, install `spotify-web-api-node` and get the client id and token from spotify's dev website (https://developer.spotify.com/dashboard). Otherwise, set `const enableSpotify` to false.
- If you want to have twitch enabled, just grab your twitch oauth code from https://twitchapps.com/tmi/ and put your channel in the options for twitch in alexa's file (lines 74-82). Make sure to set your guild and channel id (lines 84-85). Otherwise, set `const enableTwitch` to false.


After all of that, just run the bot with `node alexa.js` or with pm2 `pm2 start alexa.js`

# Extra Notes
Of course the usual disclaimer of the code not being perfect. There are some bits that aren't the best ideas to do like substr on commands and not using a json file for tokens and such, but hey, it works. And as promised, I'll get down to the reasoning of the table structure. The id is AUTO_INCREMENT because there aren't unlisted playlists, so giving the user a super long base64 11 character id to remember is not very realistic. The videos being mediumtext? Well since literally all of the video data is stored there (title, url, img url, length, id), long playlists will have a problem with being saved if it would just be text. Guild and creator need to be varchar because int's are only 11 bytes long :(. There are some hidden commands if you don't look at the code at all, ranging from just asking if alexa is alive to being a chad and helping you out during a rough time in life. Hopefully the command structure is easy enough to understand, and adding commands will be easy to do. Other than that, there are a couple of commands that I'd want to add and a couple of features that I'd like to add, searching from other user's playlist library (only if they actually made the playlist public), switching voice channels without deleting the queue, streaming! (but discord still hasn't added that to the bots arsenal of features) and permissions, so some random person can't add a song or skip it. Also, if you hate mysql, you can always replace it with whatever you like. 

