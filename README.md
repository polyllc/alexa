# alexa-play-despacito
alexa is now your own music bot, usually playing despacito. But in reality, alexa, play despacito is a fully featured music bot with lots of features that other music bots just don't have or are paid. Plus of course with the charm of alexa in discord. 
# Features
Alexa has a wide variaty of features. You can create **playlists** (also called saved queues) to play the songs in your queue anytime you want without manaully inputting the songs again. You can search through playlists made on a guild or search your own. If a friend wants to show you a playlist, but isn't in the same server as you, you can just use their playlist ID. **Seek** functionality, although very experimental (if it works is up to the rng of the day), when it does work, it's a very nice feature if you just want to skip to a certain part of a video or song. And of course the regular commands of a music bot, play youtube links, remove indexs, skip, queue list, volume control (without paying! what a revelation), swap and more. 

# Commands
- alexa, help - The help section
- alexa, play - searches YouTube with the query
- alexa, playurl - plays a url from YouTube, much faster than alexa, play
- alexa, dc - Disconnect from voice channel
- alexa, skip - skips the song
- alexa, np - shows what playing right now
- alexa, queue [page number] - shows the queue. Put the page number if the queue is long than 10
- alexa, shuffle - shuffles the songs
- alexa, create playlist [playlist name] - creates a new playlist that anyone in the guild and you can use, songs taken from queue
- alexa, playlist [playlist ID] - adds all songs in a playlist to the queue with the playlist ID
- alexa, find [g | m] - finds playlist from your guild (g) or from you (m)
- alexa, info [playlist ID] [page]- shows info about playlist
- alexa, update playlist [ID] - updates your playlist with the songs in the queue
- alexa, remove [index] - removes a song from the queue with the index
- alexa, swap [index 1] [index 2] - swaps 2 songs in a queue by their index
- alexa, pause - pause
- alexa, resume - resume
- alexa, vol - set the volume (0-100)
- alexa, auto [query] - auto generates the top 50 search results from YouTube
- alexa, repeat song [index] [amount] - repeats a song/video from the queue [amount] times.

# Installation
- You'll need the following packages: `ytdl-core`, `discord.js`, `simpleyt`, `googleapis` (only if you want yt playlist and auto gen of songs, will update soon), `mysql`, all of the packages need to be latest.
- You'll need a mysql server (since the mysql package is a bit outdated, you'll need to enable legacy support in the mysql server setup.), but if you don't care about playlist support, then you don't need this. (you'll need to remove some stuff though)
Edit the alexa.js file and input your Youtube V3 API key on line 9, your mysql database config on lines 16-19 and your discord bot token on line 46.
The mysql table structure is this: `CREATE TABLE playlists (id int NOT NULL AUTO_INCREMENT, guild VARCHAR(50), creator VARCHAR(50), title text, videos mediumtext);`, just input that to your mysql console, and you'll be good to go (make sure to select your database first! `use mysql` or `use {database name}`). More explaination on the reasoning of the structer in the extra notes. 
After all of that, just run the bot with `node alexa.js` or with pm2 `pm2 start alexa.js`

# Extra Notes
Of course the usual disclaimer of the code not being perfect. There are some bits that aren't the best ideas to do like substr on commands and not using a json file for tokens and such, but hey, it works. And as promised, I'll get down to the reasoning of the table structure. The id is AUTO_INCREMENT because there aren't unlisted playlists, so giving the user a super long base64 11 character id to remember is not very realistic. The videos being mediumtext? Well since literally all of the video data is stored there (title, url, img url, length, id), long playlists will have a problem with being saved if it would just be text. Guild and creator need to be varchar because int's are only 11 bytes long :(. There are some hidden commands if you don't look at the code at all, ranging from just asking if alexa is alive to being a chad and helping you out during a rough time in life. Hopefully the command structure is easy enough to understand, and adding commands will be easy to do. Other than that, there are a couple of commands that I'd want to add and a couple of features that I'd like to add, searching from other user's playlist library (only if they actually made the playlist public), switching voice channels without deleting the queue, streaming! (but discord still hasn't added that to the bots arsenal of features and permissions so some random person adds a song or skips it. Also, if you hate mysql, you can always replace it with whatever you like. 

