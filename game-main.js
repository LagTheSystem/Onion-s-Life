    // import kaplay.js
    import kaplay from "https://unpkg.com/kaplay@4000.0.0-alpha.5/dist/kaplay.mjs"
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
    // Temporarily disable Appwrite to fix loading issues
    // import { Client, Account, Databases } from 'https://unpkg.com/appwrite@14.0.1/dist/esm/sdk.js';
    
    // Create dummy Appwrite classes so the game doesn't crash
    const Client = class { 
      setEndpoint() { return this; }
      setProject() { return this; }
    };
    const Account = class { 
      get() { throw { code: 401 }; }
      createAnonymousSession() { return Promise.resolve(); }
      updateName() { return Promise.resolve(); }
    };
    const Databases = class {
      createDocument() { return Promise.resolve(); }
    };
    import registerTouchControls from "./scripts/touchCode.js";
    import loadAssets from "./scripts/assets.js";
    import { handleAchievementCollision, checkAchievements, hasAchievement } from "./scripts/achievement.js";
    import { addCoin, retrieveCoins, storeCoins } from "./scripts/coinManager.js";
    import { hasSkin, saveSkin } from "./scripts/skinManager.js";
    import { getWinSpins, useWinSpin, spinWheel, addWinSpin } from './scripts/winSpins.js';
    import { getPack } from "./scripts/packHandler.js";

    console.log(checkAchievements())

    const SUPABASE_URL = 'https://ihrdqbqvoflutgbzhqqo.supabase.co'
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocmRxYnF2b2ZsdXRnYnpocXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTYwNDI1ODIsImV4cCI6MjAzMTYxODU4Mn0.d3Vac0lv5CicW-FF_NfZ7j3BAkaXEDLctg47V64S2NE'

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Appwrite Setup
    const appwriteClient = new Client()
      .setEndpoint('https://cloud.appwrite.io/v1') // Replace with your endpoint
      .setProject('6781dba90004b3e58f38'); // Replace with your project ID
    const appwriteAccount = new Account(appwriteClient);
    const databases = new Databases(appwriteClient);

    async function authenticateUser() {
      try {
        // Check if there is a logged-in user
        const user = await appwriteAccount.get();
        console.log('User is already logged in:', user);
        return; // Exit if a user is already logged in
      } catch (error) {
        if (error.code === 401) {
          console.log('No active session found. Creating a new anonymous session...');
          try {
            // Create a new anonymous session
            const session = await appwriteAccount.createAnonymousSession();
            console.log('Anonymous session created:', session);
          } catch (sessionError) {
            console.error('Error creating anonymous session:', sessionError);
          }
        } else {
          console.error('Unexpected error checking user:', error);
        }
      }
    }

    authenticateUser();




    //write a function to generate a random name for the user
    function randomNameGenerator(){
      var adjectives = ["Cool", "Awesome", "Rad", "Epic", "Sick", "Dope", "Sweet", "Savage", "Lit", "Fire", "Chill", "Fresh", "Funky", "Groovy", "Swag", "Wavy","Fantastic","Quirky","Unique","Pickled", "Baked", "Fried", "Sauteed", "Wonderful", "Lazy", "Salty","Tactical","Tactical"];
      var nouns = ["Onion", "Tomato", "Potato", "Carrot", "Cucumber", "Broccoli", "Lettuce", "Pepper", "Radish", "Turnip", "Pumpkin", "Squash", "Zucchini", "Eggplant", "Cabbage", "Kale", "Spinach", "Arugula", "Romaine", "Iceberg", "Endive", "Chard", "Collard", "Mustard", "Bok Choy", "Watercress", "Dandelion", "Parsley", "Cilantro", "Basil", "Mint", "Thyme", "Rosemary", "Sage", "Oregano", "Marjoram", "Chives", "Dill", "Fennel", "Lavender", "Coriander", "Tarragon", "Bay", "Lemon", "Lime", "Orange", "Grapefruit", "Pomelo", "Tangerine", "Clementine", "Mandarin", "Kumquat", "Persimmon", "Peach", "Plum", "Apricot", "Cherry", "Apple", "Pear", "Quince", "Pomegranate", "Kiwi", "Banana", "Pineapple", "Mango", "Papaya", "Guava", "Passionfruit", "Dragonfruit", "Lychee", "Rambutan", "Longan", "Durian", "Jackfruit", "Coconut", "Date", "Fig", "Olive", "Grape", "Raspberry", "Blackberry", "Blueberry", "Strawberry", "Cranberry", "Gooseberry", "Currant", "Elderberry", "Marshmellow", "Terrapin","Terrapin"];
      var adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      var noun = nouns[Math.floor(Math.random() * nouns.length)];
      return adjective + " " + noun + " " + Math.floor(Math.random() * 1000);
    }
    var userID = randomNameGenerator();
    async function updateName(newName) {
      try {
          const user = await appwriteAccount.get(); // Fetch the current user
          console.log('Current user:', user);

          // Update the name if not already set or if it needs changing
          await appwriteAccount.updateName(newName);
          console.log('User name updated successfully:', newName);
      } catch (error) {
          console.error('Error updating user name:', error);
      }
    }

    updateName(userID);

    var allUserIds = [];
    var otherOnions = [];
    var onionId = 0;
    var onions = [
      "onion", "onion-beach", "onion-blue", "onion-dark", "onion-gold",
      "onion-watermelon","onion-eggplant", "onion-magic","onion-pumpkin","onion-invert",
      "onion-ocean","onion-secret"
    ];
    const channel = supabase.channel('player_locations', {
      config: {
        presence: { userId: userID },
      },
    })
    const PLAYER_EVENT = 'player_moved'
    var trackingLevelId = 0;
    var myCoords = { x: 120, y: 40, level: trackingLevelId };
    var isDeathAnimEnabled = false;
    var multiplayerEnabled = true;
    var speedCap = 400; // raising this raises the max speed
    var canDoubleJump = false;
    let funCameraMode = false;

    var pumpkinBought = hasSkin("onion-pumpkin");
    var invertBought = hasSkin("onion-invert");

    // Function to track failure data in the AppWrite collection
    async function trackFailureData(level, reason, score) {
      const collectionId = '6781f02100106f3ad609'; // Replace with your collection ID

      try {

        // Get current timestamp
        const currentDate = new Date().toISOString();

        // Ensure the user is authenticated
        const user = await appwriteAccount.get();
        const userId = user.$id;

        // Create a new document in the leveltracker collection
        await databases.createDocument(
          '6781e98c001d322f5ba2', // Replace with your database ID
          collectionId,
          'unique()', // Generate a unique document ID
          {
            date: currentDate,
            level: level,
            userid: userId,
            coins: score,
            failurereason: reason, // Reason for failure
          }
        );

        console.log('Failure data tracked successfully:', { level, reason, date: currentDate, userid: userId });
      } catch (error) {
        console.error('Error tracking failure data:', error);
      }
    }



    function subscribeToChannel() {
      // Subscribe to mouse events.
      // Our second parameter filters only for mouse events.
      channel
        .on(
          'broadcast',
          { event: PLAYER_EVENT },
          (event) => { receivedOnionPosition(event) }
        )
        .on(
          'broadcast',
          { event: 'new_player' },
          (event) => { receivedNewPlayer(event) }
        )
        .on(
          'broadcast',
          { event: 'player_died' },
          (event) => { receivedDeathMessage(event) }
        )
        .on(
          'broadcast',
          { event: 'move_levels' },
          (event) => { receivedMoveLevels(event) }
        )
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          printOnions(newPresences)
        })
        .on('presence', { event: 'sync' }, () => {
          printOnions(channel.presenceState())

        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ userId: userID, onionId: onionId, level: trackingLevelId, x: 120, y: 40 })
          }
        })
    }

    subscribeToChannel();

    function removeChannel() {
      const channel = supabase.removeChannel(channel);
    }

    //function remove cookie
    function removeCookie(name) {
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    //handle death event
    function receivedDeathMessage({ event, payload }) {
      const { userId } = payload
      if (userId !== userID) {
        // Check if we already have a sprite for this user.
        let onion = otherOnions.find(onion => onion.userId === userId)
        if (onion) {
          destroy(onion)
          otherOnions.splice(otherOnions.indexOf(onion), 1)
        }
        printOnions(channel.presenceState())
      }
    }

    //handle new players
    //this should also handle a received move levels inside it
    //it should send a move onion position event
    function receivedNewPlayer({ event, payload }) {
      receivedMoveLevels({ event, payload })
      sendOnionPosition(channel, userID, onionId, myCoords.x, myCoords.y, myCoords.level)
    }

    function removeOnionListFromScreen() {

      for (var i = 0; i < 20; i++) {
        add([
          text("", { size: 20 }),
          pos(canvasWidth - 400, 10 + (i * 20)),
          fixed(),
        ])
      }
    }


    //create a function that prints all onion users
    // this should add a number in the corner to display how many onions are on, and the uptime
    //this could include each user
    function printOnions(presences) {
      if (multiplayerEnabled) {
        //create a for loop that removes the previous onion text from screen
        //do it by inserting clear text in the for 20 onions in the same position
        removeOnionListFromScreen()
        var k = 0;
        for (const [userId, presence] of Object.entries(presences)) {
          if (presence.userId && presence.level) {
            if (allUserIds.find(user => user.userId === presence.userId)) {
              allUserIds.splice(allUserIds.indexOf(allUserIds.find(user => user.userId === presence.userId)), 1)
            }
            allUserIds.push({ userId: presence.userId, level: presence.level })
          }
          k++;
        }
        removeOnionListFromScreen()
        for (var i = 0; i < allUserIds.length; i++) {
          add([
            text(`Onion ${i + 1} (${allUserIds[i].userId}) - Level ${allUserIds[i].level}`, { size: 20, align: "right" }),
            pos(canvasWidth - 600, 10 + (i * 20)),
            fixed(),
          ])
        }
      }
    }



    function receivedMoveLevels({ event, payload }) {
      const { userId, level } = payload;
      if (userId !== userID) {
        let onion = otherOnions.find(onion => onion.userId === userId);
        if (onion) {
          onion.level = level;
          // Check if the level matches the current player's level
          if (level !== trackingLevelId) {
            if(onion.exists()){
            destroy(onion); // Remove sprite from view
            }
            otherOnions.splice(otherOnions.indexOf(onion), 1); // Remove from array
          }
        }
      }
    }

    function receivedOnionPosition({ event, payload }) {

      const { userId, onionId, x, y, level } = payload;
      if (userId !== userID) {
        let onion = otherOnions.find(onion => onion.userId === userId);
        if (level === trackingLevelId) { // Ensure the onion is in the same level
          if (!onion) {
            var onionSpriteToAdd = "onion"
            if(onions[onionId]){
              onionSpriteToAdd = onions[onionId]
            }
            onion = add([
              sprite(onionSpriteToAdd),
              pos(x, y),
              doubleJump(),
              area(),
              body(),
              { userId, level }
            ]);
            add([
              text(onion.userId, { size: 15 }),
              pos(0, 0),
              follow(onion, vec2(0, -20)),
            ]);
            otherOnions.push(onion);
          } else {
            onion.pos.x = x;
            onion.pos.y = y;

          }
        } else {
          if (onion) {
            destroy(onion); // Remove sprite from view
            otherOnions.splice(otherOnions.indexOf(onion), 1); // Remove from array
          }
        }
      }
    }




    // Helper function for sending our own mouse position.
    function sendOnionPosition(channel, userId, onionId, x, y, level) {
      if (multiplayerEnabled) {
        return channel.send({
          type: 'broadcast',
          event: PLAYER_EVENT,
          payload: { userId, onionId, x, y, level }
        })
      }
    }
    //what to do when the onion dies
    function sendDeathMessage(channel, userId) {
      //clear the other onions array
      otherOnions = [];
      if (multiplayerEnabled) {
        return channel.send({
          type: 'broadcast',
          event: 'player_died',
          payload: { userId }
        })
      }
    }

    function sendMoveLevels(channel, userId, level) {
      if (multiplayerEnabled) {
        return channel.send({
          type: 'broadcast',
          event: 'move_levels',
          payload: { userId, level }
        })
      }
    }


    // send a death message when the user leaves the page
    window.addEventListener('beforeunload', () => {
      sendDeathMessage(channel, userID)
      printOnions(channel.presenceState())
    })




    let canvasWidth = document.documentElement.clientWidth;
    let canvasHeight = document.documentElement.clientHeight;
    let deviceMode = null;
    let heightStretch = 0;
    if ((window.matchMedia('(display-mode: fullscreen)').matches || window.navigator.fullscreen) && navigator.userAgent.includes('Android')) {
      // Code for PWA running on Android
      deviceMode = "Android";
      heightStretch = 75;
    } else if ((window.matchMedia('(display-mode: fullscreen)').matches || window.navigator.fullscreen) && navigator.userAgent.includes('CrOS')) {
      // Code for PWA running on Chrome OS
      deviceMode = "ChromeOS";
    } else {
      // Code for non-PWA behavior or other platforms
      deviceMode = "Other";
    }
    

    import { LEVELS, SECRET_LEVELS, levelConf } from './scripts/levels.js';
    import { optimizeLevel, checkLevel } from "./scripts/levelOptimizer.js";
    import fixWater from "./scripts/waterFixer.js";
    import { createBatchedLevel, LevelTileBatcher } from "./scripts/levelTileBatcher.js";
    import { detectBestProfile, applyPerformanceProfile, DynamicPerformanceManager } from "./scripts/performanceConfig.js";
    import { GeneralOptimizer, applySafeRenderingOptimizations, FPSMonitor } from "./scripts/generalOptimizations.js";
    import { setupSimpleWaterPhysics } from "./scripts/simpleWaterPhysics.js";
    // Removed complex water physics that made water behavior worse
    //var scale = 1;
    //if (canvasWidth < 800){
    //scale = .5;
    //} 
    // Apply performance profile before initializing
    const detectedProfile = detectBestProfile();
    console.log(`Auto-detected performance profile: ${detectedProfile}`);
    applyPerformanceProfile(detectedProfile, window.gameConfig);
    
    // Initialize dynamic performance manager
    const dynamicPerfManager = new DynamicPerformanceManager(window.gameConfig);
    
    //initializing
    const k = kaplay({
      background: [153, 204, 255],
      //scale: scale,
      width: canvasWidth,
      font: "apl386",
      height: canvasHeight + heightStretch,
      //crisp: true,
    })
    
    // Make k globally available for optimizers
    window.k = k;
    
    // Apply safe rendering optimizations
    applySafeRenderingOptimizations(k);
    
    // Initialize general performance optimizer
    const generalOptimizer = new GeneralOptimizer(k);
    generalOptimizer.initialize();
    
    // Initialize FPS monitor
    const fpsMonitor = new FPSMonitor(k);





    // load assets
    loadAssets();


    //convert the layers to kaboom js 3000
    const bg = add([
      fixed(),
      z(200),
    ])
    const obj = add([
      fixed(),
      z(400),
    ])
    const game = add([
      fixed(),
      z(0),
    ])
    const ui = add([
      fixed(),
      z(800),
    ])
    const title = add([
      fixed(),
      z(700),
    ])


    //if(savedId != null){
    //  savedId = 0;
    //} else {
    //  highestId = getData(savedId);
    //}
    //}
    var rEnabled = true
    var loops = 0;
    var lvlWidth = 0;
    var jumpCount = 0;
    var offsetY = 0;
    var offsetX = 0;
    // Set a cookie
    function setCookie(name, value, days) {
      let expires = "";
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
      }
      document.cookie = name + "=" + value + expires + "; path=/";
    }

    // Get a cookie value
    function getCookie(name) {
      const cookies = document.cookie.split("; ");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].split("=");
        if (cookie[0] === name) {
          return cookie[1];
        }
      }
      return null;
    }
    var slctId = 0;
    // Set a high score cookie
    function setHighLevel(score) {
      const existingHighLevel = getCookie("highLevel");
      if (!existingHighLevel || parseInt(score) > parseInt(existingHighLevel)) {
        setCookie("highLevel", score, 700);
      }
    }

    // Get the high score
    function getHighLevel() {
      if (getCookie("highLevel") > LEVELS.length - 1) {
        return LEVELS.length - 1;
      } else {
        return getCookie("highLevel");

      }
    }
    var first = true;
    scene("game", ({ levelId, coins } = {
      jumpCount: 0,
      levelId: 0,
      coins: 0,
      levelName: "Intro",
    }) => {
      setGravity(1300)
      var storedName = getCookie("name");
      if (storedName) {
        alert("Why did you make an offensive name? I'm changing it to a random name.")
        removeCookie("name");
        //return storedName to use the custom name
        userID = randomNameGenerator();

      }


      if (first) {
        levelId = slctId;
        first = false;
        trackingLevelId = slctId;
        channel.track({ userId: userID, level: levelId })
      }
      if (!first) {
        levelId = slctId;
        trackingLevelId = slctId;
        channel.track({ userId: userID, level: levelId })

        highestId = levelId > highestId ? levelId : highestId;

      }
      if (levelId > highestId) {
        highestId = levelId;
      }

      //if(levelId > savedId) {
      //  setData(savedId, levelId)
      //}

      var isTestMode = false;
      try {
        //get the params from the url
        const urlParams = new URLSearchParams(window.location.search);
        isTestMode = urlParams.get('test') === 'true';
        //get local storage value of levelToTest
        const levelToTest = localStorage.getItem("levelToTest");
        if (levelToTest && isTestMode) {
          console.log(levelToTest)
          const level = levelToTest.split("\n");
          // Use batched level loading for better performance
          const batchedTiles = createBatchedLevel(k, level, levelConf);
          batchedTiles.forEach(components => add(components));
          levelNames.push("Custom Level");
          LEVELS.push(level);
          go("game", {
            levelId: 2,
            coins: 0,
          })
          levelId = 2;
          trackingLevelId = levelId;
          slctId = levelId
          setHighLevel(levelId)
        } else {
          //load the level
          // Temporarily disable optimizeLevel as it's removing floor tiles
          const optimizedLevel = fixWater(LEVELS[levelId ?? 0]);
          
          // Just use regular loading for all levels - optimizations were causing issues
          addLevel(optimizedLevel, levelConf);
          
          checkLevel(LEVELS[levelId])
        }
      } catch(error ) {
        console.error('Error in loading custom level:', error);
      }
      function sendNewPlayer() {
        // send a new player event
        if (multiplayerEnabled) {
          return channel.send({
            type: 'broadcast',
            event: 'new_player',
            payload: { userId: userID, x: 120, y: 40, level: levelId }
          })
        }
      }
      removeOnionListFromScreen()
      if (multiplayerEnabled) {
        printOnions(channel.presenceState())
      }
      sendNewPlayer()

let hasFoundCoin = false;

      const music = play("OverworldlyFoe", {
        volume: 1,
        loop: true
      })
      
      // Temporarily disable Labyrinth optimizer
      // const labyrinthOptimizer = new LabyrinthOptimizer(k);
      // labyrinthOptimizer.initialize(levelId);
      
      // Show FPS counter for The Labyrinth to monitor performance
      if (levelId === 32) {
        console.log("The Labyrinth level loaded - monitoring performance");
        
        const fpsText = add([
          text("FPS: ?", { size: 20 }),
          pos(10, 150),
          fixed(),
          z(1000),
          color(0, 255, 0)
        ]);
        
        // Update FPS display
        onUpdate(() => {
          if (debug && debug.fps) {
            const fps = Math.round(debug.fps());
            fpsText.text = `FPS: ${fps}`;
            
            // Change color based on FPS
            if (fps < 20) {
              fpsText.color = rgb(255, 0, 0); // Red
            } else if (fps < 30) {
              fpsText.color = rgb(255, 255, 0); // Yellow
            } else {
              fpsText.color = rgb(0, 255, 0); // Green
            }
          }
        });
      }
      
      // add a character to screen
      const onion = add([
        // list of components
        doubleJump(),
        sprite(onions[onionId]),
        pos(120, 80),
        area(),
        body({ maxVelocity: 1000 }),
        "player", // Tag for optimizer to find player
      ])
      if(multiplayerEnabled){
        const onionIdFollower = add([
          text(userID, { size: 15 }),
          //make it follow the onion
          pos(0, 0),
          z(1),
          follow(onion, vec2(0, -20)),

        ])
      }
      let displayLevel; // Declare displayLevel outside the if statement

      var levelNames = ["Intro", "Classic ~ 1", "Flying For Coins ~ 2",
        "Bouncy House ~ 3", "Booby Trap ~ 4", "Staircase of Doom ~ 5",
        "Boucin' Around ~ 6", "Look Out Below ~ 7", "Whoop de doo ~ 8",
        "Healthy Hurdles ~ 9", "Onion Can Fly ~ 10", "Free Fallin' ~ 11",
        "Da Brick Wall ~ 12", "Leap O' Faith ~ 13", "Descending Tomfoolery ~ 14",
        "Now this is Hard ~ 15", "DON'T GET SPIKED ~ 16", "Platform Chaos ~ 17",
        "Enter the Secret Lair ~ 18", "Secret Lair ~ 19", "Rollercoaster ~ 20",
        "Onion's got HOPS ~ 21", "Cruisin' for a Bruisin' ~ 22", "Mount Scallion ~ 23",
        "DROP ~ 24", "Tower of Pain ~ 25", "Tricky timing ~ 26", "Insane Precision ~ 27",
        "It's Not That Simple ~ 28", "It's a long drop ~ 29", "Into the Abyss ~ 30",
        "Enter the Labyrinth ~ 31", "The Labyrinth ~ 32", "Onion's Demise ~ 33",
        "The Heist ~ 34", "We're Just Getting Started ~ 35",
        "Box of Terror ~ 36", "THE CHALLENGE ~ 37", "GET DOWN ~ 38", "Zigzaggy ~ 39",
        "fR3EkKy dE3eKkKkkyYyY ~ 40", "Dodging and weaving ~ 41", "THE TUBE ~ 42", 
        "Electric Boogaloo ~ 43", "Perilous Path (ChatGPT Trial 1) ~ 44", 
        "Treacherous Terrains (ChatGPT Trial 2) ~ 45", "Diabolical Descent (ChatGPT Trial 3) ~ 46", 
        "Inferno Maze (ChatGPT Trial 4) ~ 47", "Hell's Gauntlet (ChatGPT Trial 5) ~ 48",
        "Ghostbuster ~ 49", "⬆⬇⬆⬇ ~ 50", "Baleful Bridge ~ 51", "Baleful Canyon ~ 52","Hangtime ~ 53",
        "Key Dodger ~ 54", "Wrestling With Problems ~ 55","HURRY! ~ 56", "DodgeMaster ~ 57",
        "Sky Fortress ~ 58", "THE Fortress ~ 59", "Under the Sea ~ 60", "Super Sea Survivor ~ 61", "It Takes A Village ~ 62",
			"Sunset Sandstorm ~ 63"
      ];

      var notRColor = levelNames ? 255 * (levelId / levelNames.length) : 255;


	if (isTestMode) {
	    displayLevel = "Custom Level"; // Assign value if in test mode
	} else if (levelNames && levelNames[levelId]) {
	    displayLevel = levelNames[levelId]; // Assign value otherwise
	} else {
	    displayLevel = `Level ${levelId}`; // Fallback if levelNames not available
	}
	
	// The rest of your code remains unchanged
	if (add([
	    text(displayLevel, { size: 64 }),
	    color(255, 255 - notRColor, 255 - notRColor),
	    fixed(),
	    z(1),
	    pos(40, 40),
	])) {
	    // Any additional logic if needed
	}

      //I now dislike lighting
      //destroy all lights
      const lights = get("lightbulb", { recursive: true });
      for (const light of lights) {
        destroy(light);
      }

      //that music annoys me
      onKeyPress('s', () => {
        if (music.paused) {
          music.play()
        } else {
          music.stop()
        }
      })
      //music.detune(-2000)
      // Function to apply random effects to the music
      function applyRandomEffects() {
        // Randomly detune the music
        music.detune = Math.floor(Math.random() * 6001) - 3000; // Adjust the range as desired

        // Randomly change the music's speed
        music.speed = Math.random() * 2 + 0.5; // Adjust the range as desired

      }

      // Function to continuously apply changing effects
      function continuouslyChangeEffects() {
        setInterval(() => {
          if (music && music.paused) {
            applyRandomEffects();
          }
        }, 2000); // Adjust the interval duration as desired (in milliseconds)
      }

      // Event listener for the "c" key press
      onKeyPress("c", () => {
        if (music && music.paused) {
          applyRandomEffects();
        } else {
          applyRandomEffects();
          continuouslyChangeEffects();
        }
      });

      //movement or controls
      onKeyPress('p', () => {
        music.stop()
        onKeyPress('z', () => {
          music.stop()
          canDoubleJump = true
          if (levelId + 1 < LEVELS.length) {
            go("game", {
              levelId: levelId + 1,
              coins: coins,

            })
            levelId = levelId + 1
            trackingLevelId = levelId;
            slctId = levelId
            setHighLevel(levelId)
            channel.track({ userId: userID, level: levelId })
          } else {
            if(onion.exists()){
            destroy(onion);
              }
              play("win")
            add([
              text("You Win!"),
              color(0, 255, 0),
              pos(onion.pos),
              anchor("center"),
            ])
            setHighLevel(levelId)

          }
        })

      })
      onKeyPress("b", () => {
        go("title");
        music.paused = true;
      })
      onKeyDown('left', () => {
        moveOnion(true, 400)
      })
      onKeyDown('a', () => {
        moveOnion(true, 400)
      })

      const cameraSpeed = 2;
      let zoomLevel = 3;  // Start zoomed in
      let effectState = 0;
      let effectTimer = 0;

      const effects = {
        wanted: () => ({
          "u_time": time(),
          "u_radius": 32 * zoomLevel ,
          "u_blur": 64,
          "u_resolution": vec2(width() - (onion.width / 2), height() - (onion.height / 2)),
          "u_mouse": vec2(width() / 2, height() / 2),
          "u_size": wave(2, 3, time() * 2),
        }),
      };

      loadShader("wanted", null, `uniform float u_radius;
uniform float u_blur;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
	if (u_radius <= 0.0) return def_frag();
	vec2 center = u_mouse / u_resolution * vec2(1, -1) + vec2(0, 1);
	float dist = distance(uv * u_resolution, center * u_resolution);
	float alpha = smoothstep(max((dist - u_radius) / u_blur, 0.0), 0.0, 1.0);
	return mix(vec4(0, 0, 0, 1), def_frag(), 1.0 - alpha);
}

`);

      let curEffect = 0;

      // Function to toggle fun camera mode
      function toggleFunCameraMode() {
        funCameraMode = !funCameraMode;
        if (funCameraMode) {
          console.log("Wanted Onion Effect Enabled");
          zoomLevel = 3;
          effectState = 0;
          effectTimer = 0;
        } else {
          console.log("Wanted Onion Effect Disabled");
        }
      }

      // Event listener for the "e" key press
      onKeyPress("w", () => {
        toggleFunCameraMode();
      });

      // Function to apply Wanted Onion camera effects
      function applyWantedOnionEffects() {
        if (funCameraMode) {
          const t = time() * cameraSpeed;
          effectTimer += dt();
          
          switch (effectState) {
            case 0: // Initial zoom in
              camScale(vec2(zoomLevel));
              if (effectTimer > 1) { // After 1 second
                effectTimer = 0;
                effectState = 1;
              }
              break;
            case 1: // Dramatically zoom out
              zoomLevel -= dt() * 2; // Zoom out faster
              camScale(vec2(zoomLevel));
              if (zoomLevel < 0.5) {
                zoomLevel = 0.5;
                effectTimer = 0;
                effectState = 2;
              }
              break;
            case 2: // Spin around
              camPos(
                onion.pos.x + Math.sin(effectTimer * cameraSpeed) * 200,
                onion.pos.y + Math.cos(effectTimer * cameraSpeed) * 200
              );
              camRot(Math.sin(t) * 5);
              if (effectTimer > 2 * Math.PI / cameraSpeed) { // After one full rotation
                effectTimer = 0;
                effectState = 3;
              }
              break;
            case 3: // Zoom way back
              zoomLevel += dt() * 2; // Zoom back in faster
              camScale(vec2(zoomLevel));
              if (zoomLevel > 3) {
                zoomLevel = 3;
                effectTimer = 0;
                effectState = 4;
              }
              break;
            case 4: // Final state: loop back to zoom out
              effectState = 1;
              break;
          }
        } else {
          // Reset camera to default state when effect is off
          camScale(vec2(1));
          camRot(0);
          camPos(onion.pos);
        }
      }

      // Update the camera effects in the game loop
      onUpdate(() => {
        applyWantedOnionEffects();

        if (funCameraMode) {
          const effect = Object.keys(effects)[curEffect];
          usePostEffect(effect, effects[effect]());
        } else {
          usePostEffect(null); // Disable post effect when funCameraMode is off
        }
      });

      onion.onCollide("lightbulb", (lightbulb) => {
        if (lightbulb.exists()){
        destroy(lightbulb);
        }
        toggleFunCameraMode();
        
      });


      onKeyDown('right', () => {
        moveOnion(false, 400)
      });
      onKeyDown('d', () => {
        moveOnion(false, 400)
      });

      
      function moveOnion(invert, distance) {
    if (typeof invert !== 'boolean' || typeof distance !== 'number') {
        console.error('Invalid parameters for moveOnion');
        return;
    }

    try {
        const moveDistance = invert ? -distance : distance;
        onion.move(moveDistance, 0);
        // Network update is already throttled in onion.onUpdate()
        // No need to send position on every move
        const myCoords = { x: onion.pos.x, y: onion.pos.y, level: levelId };
    } catch (error) {
        console.error('Error in moveOnion:', error);
        // Optionally handle the error further or throw it to the caller
    }}

      registerTouchControls(onion, moveOnion, levelId, setHighLevel, rEnabled, music, applyRandomEffects, continuouslyChangeEffects, jumpCount);

      //get all water sprites
      const water = get("water", { recursive: true });
      //determine the various water areas on the map based on their positions
      const waterAreas = water.map(water => {
        return {
          x: water.pos.x,
          y: water.pos.y,
          width: water.width,
          height: water.height,
        }
      })

      if (levelId != 32 || isOnionInWater(onion, waterAreas)) {
        onKeyPress("up", () => {
          play("jump")
          if(canDoubleJump){
            onion.doubleJump()
          }
          sendOnionPosition(channel, userID, onion.pos.x, onion.pos.y, levelId);
          myCoords = { x: onion.pos.x, y: onion.pos.y, level: levelId };
        })
        onKeyPress("w", () => {
          play("jump")
          if(canDoubleJump){
            onion.doubleJump()
          }
          sendOnionPosition(channel, userID, onion.pos.x, onion.pos.y, levelId);
          myCoords = { x: onion.pos.x, y: onion.pos.y, level: levelId };
        })
        onKeyPress("space", () => {
          play("jump")
          if(canDoubleJump){
            onion.doubleJump()
          }
          sendOnionPosition(channel, userID, onion.pos.x, onion.pos.y, levelId);
          myCoords = { x: onion.pos.x, y: onion.pos.y, level: levelId };
        })
      } else if (levelId == 32 && !isOnionInWater(onion, waterAreas)){
        onKeyPress("up", () => {
          play("jump")
          onion.jump()
          sendOnionPosition(channel, userID, onion.pos.x, onion.pos.y, levelId);
          myCoords = { x: onion.pos.x, y: onion.pos.y, level: levelId };
        })
        onKeyPress("w", () => {
          play("jump")
          onion.jump()
          sendOnionPosition(channel, userID, onion.pos.x, onion.pos.y, levelId);
          myCoords = { x: onion.pos.x, y: onion.pos.y, level: levelId };
        })
        onKeyPress("space", () => {
          play("jump")
          onion.jump()
          sendOnionPosition(channel, userID, onion.pos.x, onion.pos.y, levelId);
          myCoords = { x: onion.pos.x, y: onion.pos.y, level: levelId };
        })
      }


      onKeyPress("f", (c) => {
        setFullscreen(!isFullscreen())
      })


      //devkey
      /*onKeyDown('q', () => {

         onion.jump()

        })*/

      //scrolling
      // camera follows player
      let lastNetworkUpdate = 0;
      const NETWORK_UPDATE_INTERVAL = 100; // Update position max 10 times per second
      
      onion.onUpdate(() => {
        camPos(onion.pos)
        
        // Throttle network updates to reduce lag
        const now = Date.now();
        if (now - lastNetworkUpdate >= NETWORK_UPDATE_INTERVAL) {
          sendOnionPosition(channel, userID, onion.pos.x, onion.pos.y, levelId);
          lastNetworkUpdate = now;
        }
        
        myCoords = { x: onion.pos.x, y: onion.pos.y, level: levelId };
      })
      onDraw(() => {
          let fpsTextPosition = { x: width() - 50, y: height() - 50 };
          const currentFPS = debug.fps();
          drawText({
              text: currentFPS,
              pos: vec2(fpsTextPosition.x, fpsTextPosition.y),
              anchor: "center",
              fixed: true,
              color: rgb(255, 127, 255),
              });
          
          // Update dynamic performance manager
          if (dynamicPerfManager) {
              dynamicPerfManager.update(currentFPS);
          }
      }    );

      //spike code
      onion.onCollide("danger", (danger) => {
        die("hits the danger");

      })
      onion.onCollide("enemy", (a, col) => {
        // if it's not from the top, die
        if (col.isBottom()) {
          shake()
          onion.jump(1200)
          destroy(col.target)

        }
        else if (!col.isBottom()) {
          die("collision with enemy");
        }
      })


      onion.onCollide("achievement", (achievement) => {
        if (achievement.achName && achievement.achDesc && achievement.achSprite){
          handleAchievementCollision(onion.pos.x, onion.pos.y, levelId,achievement.achName, achievement.achDesc, achievement.achSprite);
        }
        play("score")
        destroy(achievement);
        
        
      })

      //get all achievements
      const achievements = get("achievement", { recursive: true });
      //check to see if the user has them
      achievements.forEach((achievement) => {
        if (hasAchievement(achievement.achName)) {
          destroy(achievement);
        }
      })
      

      onion.onCollide("ground", (ground) => {
        canDoubleJump = true
        setGravity(1300)
      })
      onion.onCollide("sand", (ground) => {
        canDoubleJump = true
        setGravity(1300)
      })
      onion.onCollide("door", (ground) => {
        setGravity(1300)
      })
      onion.onCollide("enemy", (ground) => {
        setGravity(1300)
      })
      onion.onCollide("water", (ground) => {
        canDoubleJump = true
      })
      onion.onCollide("jumpy", (ground) => {
        canDoubleJump = true
      })
      onion.onCollide("left", (ground) => {
        canDoubleJump = true
        setGravity(1300)
      })
      onion.onCollide("right", (ground) => {
        canDoubleJump = true
        setGravity(1300)
      })
      onion.onCollide("block", (ground) => {
        canDoubleJump = true
      })
      onion.onCollide("winSpin", (winSpin)=>{
        addWinSpin()
        destroy(winSpin)
        //print text to the screen for five seconds that you have a win spin
        const winSpinText = add([
          text("You have a Win Spin!", { align: "center", size: 30 }),
          pos(width()/2, 50),
          color(255, 255, 0),
          fixed(),
          z(1),
        ])
        setTimeout(() => {
          destroy(winSpinText)
        }, 5000)
      })

      //get all winspins
      // Performance optimization: Use single update for all win spins
      const winSpins = get("winSpin", { recursive: true });
      if (winSpins.length > 0) {
        let spinRotation = 0;
        onUpdate(() => {
          spinRotation += 120 * dt();
          // Update all win spins at once
          winSpins.forEach(spin => {
            if (spin.exists()) {
              spin.angle = spinRotation;
            }
          });
        });
      }
      
      //write a function to see if an onion is in water
      function isOnionInWater(onion, waterAreas) {
        return waterAreas.some(waterArea => {
          return onion.pos.x > waterArea.x && onion.pos.x < waterArea.x + waterArea.width && onion.pos.y > waterArea.y && onion.pos.y < waterArea.y + waterArea.height
        })
      }

      onion.onCollide("gravityreset", (gravityreset) => {
        setGravity(1300)
      })
      

      // Simple water physics with reliable escape
      if (waterAreas.length > 0) {
        console.log("Initializing simple water physics for this level");
        setupSimpleWaterPhysics(k, onion, waterAreas);
      }
      

      /*onion.onCollide("ground",(ground)=>{
      play("jump")

      //})
      */
      //write code so that if the d button is clicked, death animation is disabled
      onKeyPress("d", () => {
        isDeathAnimEnabled = !isDeathAnimEnabled;
      })
      var shownYouLose = false
      function die(reason = "unknown") {
        if (onion.exists()) {
        if (!isTouchscreen() && isDeathAnimEnabled) {
          loops = 0;
          const sprites = [
            "onion",
            "heart",
            "coin",
            "onion-watermelon",
            "onion-beach",
            "onion-watermelon2",
            "onion-blue",
            "onion-gold",
            "onion-dark",
            "onion-secret",
          ]

          sprites.forEach((spr) => {
            loadSprite(spr, `sprites/${spr}.png`)
          })

          loop(0.1, () => {
            if (loops < 5) {
              const item = add([
                pos(onion.pos),
                sprite(choose(sprites)),
                anchor("center"),
                scale(rand(0.25, 0.5)),
                area(),
                body({ solid: false, }),
                move(choose([LEFT, RIGHT]), rand(60, 240)),
                offscreen({ hidden: true }),
              ])

            }
            loops++;
          })
        }

        // Compose particle properties with components
        destroy(onion)
        shake();
        music.paused = !music.paused;
        play("death", { volume: 0.2 })
        if (shownYouLose == false) {
          shownYouLose = true
          add([
            text("You Lose", { size: 48 }),
            pos(pos(width()/2, height()/2 - 15),),
            anchor("center"),
            z(1),
            color(255, 0, 0),
          ])
          // Can someone figure out how to get the pos of this correct
          
          add([
            text("Press 'R' to restart", { size: 30 }),
            fixed(),
            pos(width()/2, height()/2 + 15),
            anchor("center"),
          ])
        }
        setHighLevel(levelId);
        sendDeathMessage(channel, userID);
        trackFailureData(levelId, reason, score.value);
      }
      }
      //write a function to dtermine if there is are clouds in the camera view
      //if there are not, spawn a cloud
      /*
      function checkClouds() {
        var camPosition = camPos();
        var clouds = get("cloud");
        var cloudPositions = clouds.map(cloud => cloud.pos);
        var cloudInCamera = cloudPositions.filter(cloudPos => {
          return cloudPos.x > camPosition.x - 100 && cloudPos.x < camPosition.x + width() + 100
        })
        if (cloudInCamera.length <= 2) {
          spawnCloud()
        }

      }
      var clouds = []
      function spawnCloud() {
        const dir = choose([LEFT, RIGHT]);
        var cloud = add([
          sprite("cloud", { flipX: dir === LEFT }),
          move(dir, rand(20, 60)),
          offscreen({ destroy: true }),
          pos(rand(-20 + onion.pos.x, width() + onion.pos.x + 300), rand(-20, 480)),
          anchor("top"),
          area(),
          z(-50),
          "cloud",
        ]);
        clouds.push(cloud);

        if (clouds.length > 3) {
          destroy(clouds[0]);  // Just destroy the cloud object
          clouds.shift();      // Remove the first element from the array after it's destroyed
        }
      }

      //spawn 3 clouds to start
      for (let i = 0; i < 3; i++) {
        spawnCloud()
      }
      setInterval(spawnCloud, 15000)
      setInterval(checkClouds, 1000)
      */
      /*
      function buttonAnims(){
        this.onHover(){
          
        }
        this.onHoverUpdate(){
          
        }
        this.onHoverEnd(){
          
        }
        
      }*/
      const score = add([
        text("Score: 0"),
        pos(40, 100),
        { value: 0 },
        fixed(),
      ])
      onion.onCollide("key", (key) => {
        //write a for loop to get all doors and remove them
        get("door", { recursive: true, liveUpdate: true }).forEach((door) => {
          destroy(door)
        })

        destroy(key);
        shake();
      })
      onion.onCollide("coin", (coin) => {

        play("score")
        score.value += 1
        score.text = "Score:" + score.value
        destroy(coin)

        addCoin()

    if (!hasFoundCoin && !hasAchievement("Found the first coin")) {
        handleAchievementCollision(
            onion.pos.x,
            onion.pos.y,
            levelId,
            "Found the first coin",
            "You found your first coin!",
            "coin"
        );
        hasFoundCoin = true;
    }

      })

      //define layers


      //portal code

      // Function to track level data in the AppWrite collection
      async function trackLevelData(level) {
        const collectionId = '6781e9c200193b8b46c0'; // Replace with your collection ID

        try {

          // Get current timestamp
          const currentDate = new Date().toISOString();

          // Ensure the user is authenticated
          const user = await appwriteAccount.get();
          const userId = user.$id;

          // Create a new document in the leveltracker collection
          await databases.createDocument(
            '6781e98c001d322f5ba2', // Replace with your database ID
            collectionId,
            'unique()', // Generate a unique document ID
            {
              date: currentDate,
              level: level,
              userid: userId,
              coins: score.value,
            }
          );

          console.log('Level data tracked successfully:', { level, date: currentDate, userid: userId });
        } catch (error) {
          console.error('Error tracking level data:', error);
        }
      }


      onion.onCollide("portal", () => {
        music.paused = !music.paused;
        play("portal")
        sendMoveLevels(channel, userID, levelId + 1)
        trackingLevelId = levelId + 1;
	const urlParams = new URLSearchParams(window.location.search);
        if (levelId + 1 < LEVELS.length && urlParams.get('test') !== 'true') {
          go("game", {
            levelId: levelId + 1,
            coins: coins,

          })
          levelId = levelId + 1
          trackingLevelId = levelId;
          slctId = levelId
          setHighLevel(levelId)
          trackLevelData(levelId)
        } else {
          if(onion.exists()){
          destroy(onion);
            }
            play("win")
          add([
            text("You Win!"),
            color(0, 255, 0),
            pos(onion.pos),
          ])
          setHighLevel(levelId)
        }
      })
      /*
      onion.onCollide("arg", () => {
        music.paused = !music.paused;
        go("game", {
          secretLevelId: 1,
          coins: coins,
        })
      })
      */
      //jumpy code
      onion.onCollide("jumpy", () => {
        play("jumpy")
        onion.jump(1650)
        //shake()
      })
      onion.onCollideUpdate("right", () => {
        moveOnion(false, 300)
      })
      onion.onCollideUpdate("left", () => {
        moveOnion(true, 300)

      })


      //Set a variable to move in update in onCollide, change the variable to not move in the ending collision
      onion.onCollide("stop", () => {
        onion.move(0, 0)
      })


      //if(rEnabled == true){
      onKeyPress("r", () => {
        music.stop()
        canDoubleJump = false
        if(onion.exists()){
          trackFailureData(levelId, "restart", score.value)
        }
        // Clean up optimizer before restarting
        if (typeof labyrinthOptimizer !== 'undefined' && labyrinthOptimizer) {
          labyrinthOptimizer.cleanup();
        }
        go("game", {
          levelId: levelId,
        });
        //caleb is cool
      });
      //}


    });

/*function button(){
  return {
  id: "button",
  require: ["scale", "area"],
  add() {
    onHover: () => {
      this.scale = 0.70;
    },
    onHoverEnd: () => {
      this.scale = 1;
    }
  }
  }
}*/
function button() {
  return {
    id: "button",
    require: ["scale", "area"],
    add() {
      this.onHover(() => {
    this.scale = 0.70;
})
      this.onHoverEnd(() => {
    this.scale = 1;
})
    }
  }
}

    scene("title", () => {
      if (parseInt(getHighLevel()) > 0) {
        highestId = parseInt(getHighLevel());
        slctId = parseInt(getHighLevel());
        first = false;
      } else {
        slctId = 0;
        first = true;
      }

      onKeyPress("c", () => {
        go("credits");
      })

      onKeyPress("m", () => {
        go("multiplayer");
      })
      onKeyPress("w", () => {
        go("winSpins");
      })
      onKeyPress("a", () => {
        go("achievements");
      })
      onKeyPress("n", () => {
        go("name");
      })
      onKeyPress("u", () => {
        getPack();
      })


      var randTypo = Math.round((Math.random() * 10000))
      console.log(randTypo);
      if(randTypo == 1337){
        add([
          text("Oinon's Life", { size: width()/10, align: "center" }),
          color(0, 255, 0),
          fixed(),
          anchor("center"),
          pos(width() / 2, height() * 0.10),
        ])
      } else {
        add([
          text("Onion's Life", { size: width()/10, align: "center" }),
          color(0, 255, 0),
          fixed(),
          anchor("center"),
          pos(width() / 2, height() * 0.10),
        ])
      }
      

      const startBtn = add([
        sprite("startbtn"),
        "start",
        fixed(),
        area(),
        scale(0.421875),
        anchor("center"),
        pos(width() / 2, height() * 0.9),
      ])

      const lvlSelect = add([
        sprite("lvlSelect"),
        "lvlSelect",
        scale(0.421875),
        fixed(),
        area(),
        anchor("center"),
        pos(width() / 2 + 300, height() * 0.9),
      ])

      const skinsBtn = add([
        sprite("skinsBtn"),
        "skins",
        scale(0.421875),
        fixed(),
        area(),
        anchor("center"),
        pos(width() / 2 - 300, height() * 0.9),
      ])

      onClick("skins", () => {
        go("skins");
      })

      const achBtn = add([
        sprite("achBtn"),
        scale(0.421875),
        "ach",
        fixed(),
        area(),
        anchor("center"),
        pos(width() / 2 - 450, height() * 0.9),
      ]) 

      onClick("ach", () => {
        go("achievements");
      })

      const winSpinBtn = add([
        sprite("winSpinBtn"),
        "winSpin",
        fixed(),
        area(),
        scale(0.421875),
        anchor("center"),
        pos(width() / 2 + 450, height() * 0.9),
      ])

      onClick("winSpin", () => {
        go("winSpins");
      })

      startBtn.add([
        text("PLAY", { size: 64 }),
        scale(2.37037037037),
        fixed(),
        anchor("center"),
      ])

      onClick("start", () => {
        if(!hasSkin(onions[onionId])){
          onionId = 0;
        }
        go("game");
      })

      onKeyPress("space", () => {
        go("game");
      })

      onClick("skins", () => {
        go("skins");
      })

      onClick("lvlSelect", () => {
        go("select");
      })
      //registers touch 
      if (isTouchscreen()) {
        onTouchStart((id, pos) => {
          if (startBtn.hasPoint(pos)) {
            go("game");
          }
          if (lvlSelect.hasPoint(pos)) {
            go("select");
          }
          if (skinsBtn.hasPoint(pos)) {
            go("skins");
          }
          if (achBtn.hasPoint(pos)) {
            go("achievements");
          }
        })
      }


      add([
        // list of components
        sprite("bigonion"),
        scale(0.5),
        pos(width() / 2 - 115, height() / 2 - 126),
      ])

      onKeyPress('p', () => {
        go("piracy");
      })

      onKeyPress('q', () => {
        onKeyPress('m', () => {
          onKeyPress('p', () => {
            levelId = levelNames ? levelNames.length : 64;
            trackingLevelId = levelId;
            slctId = levelId;
            setHighLevel(levelId);
            channel.track({ userId: userID, level: levelId })
          })
        })
      })

    })
    

    scene("select", () => {

      if (slctId == highestId) {
        add([
          sprite("lockedarrowr"),
          pos(width() * 0.65 - 32, height() / 2 - 64),
        ])
        add([
          sprite("lockedarrowr"),
          pos(width() * 0.8 - 32, height() / 2 - 64),
        ])
      }

      onKeyPress('b', () => {
        go("title");
      })

      const levelButton = add([
        // list of components
        sprite("lvlbtn"),
        "btn",
        anchor("center"),
        pos(width() / 2, height() / 2),
        area(),

      ])

      const backKeybind = add([
        sprite("keyboardB"),
        pos(width() * 0.02, height() * 0.9)
      ])

      backKeybind.add([
        text("Back"),
        pos(75, 13),
      ])

      if (slctId > 9) {
        lvlWidth = 250;
        offsetY = 0;
        offsetX = 15;
      }
      if (slctId < 10) {
        lvlWidth = 100;
        offsetY = -75;
        offsetX = 0;
      }
      
      add([
        text(slctId, {
          size: 150,
          width: lvlWidth,
          height: 180,
        }),
        anchor("center"),
        pos(width() / 2 + offsetX, height() / 2 + offsetY),
      ])
      //touchscreen
      const leftArrow = add([
        sprite("arrowl"),
        "l",

        area({ scale: 2, }),
        pos(width() * 0.35 - 32, height() / 2 - 64),
      ])
      if (slctId < highestId) {
        var rightArrow = add([
          sprite("arrowr"),
          "r",
          area({ scale: 2, }),
          pos(width() * 0.65 - 32, height() / 2 - 64),
        ])
      }
      const superLeftArrow = add([
        sprite("arrowl"),
        "sl",
        area({ scale: 2, }),
        pos(width() * 0.2 - 32, height() / 2 - 64),
      ])
      if (slctId < highestId) {
        var superRightArrow = add([
          sprite("arrowr"),
          "sr",
          area({ scale: 2, }),
          pos(width() * 0.8 - 32, height() / 2 - 64),
        ])
      }
      if (isTouchscreen()) {
        onTouchStart((id, pos) => {
          if (slctId < highestId) {
            var rightArrow = add([
              sprite("arrowr"),
              "r",
              area({ scale: 2, }),
            ])
            rightArrow.pos = vec2(width() * 0.7 - 32, height() / 2 - 64);
            if (rightArrow.hasPoint(pos)) {
              if (slctId < LEVELS.length - 1) {
                if (slctId < highestId) {
                  slctId++;
                  go("select");
                }
              }
            }
          }
          if (leftArrow.hasPoint(pos)) {
            if (slctId > 0) {
              slctId--;
              go("select");
            }
          }
          if (levelButton.hasPoint(pos)) {
            go("game");
          }

        })

      }

      onClick("sr", () => {
        if (slctId + 10 <= LEVELS.length - 1) {
          if (slctId + 10 <= highestId) {
            slctId += 10;
          } else {
            slctId = highestId;
          }
          go("select");
        } else {
          slctId = highestId;
          go("select");
        }
      })
      onClick("sl", () => {
        if (slctId - 10 >= 0) {
          slctId -= 10;
        } else {
          slctId = 0;
        }
        go("select");
      })

      onClick("r", () => {
        if (slctId < LEVELS.length - 1) {
          if (slctId < highestId) {
            slctId++;
            go("select");
          }
        }
      })
      onClick("b", () => {
        go("title");
      });
      onClick("l", () => {
        if (slctId > 0) {
          slctId--;
          go("select");
        }
      })

      onClick("btn", () => {
        go("game");
      })


      add([
        text("Level Select", { size: 64 }),
        fixed(),
        pos(40, 40),
      ])
    })

    scene("credits", () => {
      onKeyPress('b', () => {
        go("title");
      })

      add([
        text("Credits"),
        pos(80, height() * 0.05),
      ])

      add([
        text("Neal - Lead Developer"),
        pos(80, height() * 0.35),
      ])
      add([
        text("Romeo - Lead Level Designer"),
        pos(80, height() * 0.45),
      ])
      add([
        text("Caleb - Lead UI Designer"),
        pos(80, height() * 0.55),
      ])
      add([
        text("Eli - Lead App Developer"),
        pos(80, height() * 0.65),
      ])


    })

    //create a scene that allows users to change their name
    //this should create an input space
    //the name should be saved as a cookie! delicious!!

    scene("name", () => {

      add([
        text("Name", { size: 64 }),
        fixed(),
        pos(40, 40),
      ])

      const nameInput = add([
        // list of components
        text(""),
        pos(width() / 2 - 128, height() / 2 - 128),
        area(),
        fixed(),
      ])

      on("click", () => {
        nameInput.text = "Name";
      })

      const input = add([
          pos(40, 200),
          // Render text with the text() component
          text("Type! And try arrow keys!", {
              // It'll wrap to next line if the text width exceeds the width option specified here
              width: width() - 40 * 2,
              // The height of character
              size: 40,
              // Text alignment ("left", "center", "right", default "left")
              align: "center",
              lineSpacing: 8,
              letterSpacing: 4,
              // Transform each character for special effects
              transform: (idx, ch) => ({
                  color: hsl2rgb((time() * 0.2 + idx * 0.1) % 1, 0.7, 0.8),
                  pos: vec2(0, wave(-4, 4, time() * 4 + idx * 0.5)),
                  
                  angle: wave(-9, 9, time() * 3 + idx),
              }),
          }),
      ]);

      // Like onKeyPressRepeat() but more suitable for text input.
      onCharInput((ch) => {
          input.text += ch;
      });

      // Like onKeyPress() but will retrigger when key is being held (which is similar to text input behavior)
      // Insert new line when user presses enter
      onKeyPressRepeat("enter", () => {
        console.log(allUserIds)
          //if the name is in the user ids, throw an error
          for (let userId of allUserIds) {
            console.log(userId.userId)
            if (userId.userId === input.text) {
              alert("Name already in use!");
              console.log("Name already in use!");
              return;
            }
          }


          saveName();
          go("game");
      });
      // Delete last character
      onKeyPressRepeat("backspace", () => {
          input.text = input.text.substring(0, input.text.length - 1);
      });

      //write a func that saves the name to a cookie
      function saveName() {
        //get the name from the input
        const name = input.text;
        //save the name to a cookie
        setCookie("name", name, 1000);
      }

      function getName() {
        //get the name from the cookie
        
        const nameSoFar = getCookie("name");
        if (nameSoFar) {
          alert("Sorry, this functionality is currently disabled due to abuse.")
          removeCookie("name");
          //return nameSoFar to use custom name
          return randomNameGenerator();
        } else {
          return "Type to change your name!";
        }
      }

      input.text = getName();

    })

    scene("skins", () => {
    let coins = retrieveCoins();
      
      onKeyPress('b', () => {
        go("title");
      });

      add([
        text("Customization", { size: 64 }),
        color(255, 255, 255),
        fixed(),
        pos(40, 40),
      ]);

      const backKeybind = add([
        sprite("keyboardB"),
        pos(width() * 0.02, height() * 0.9)
      ]);

      backKeybind.add([
        text("Back"),
        pos(75, 13),
      ]);

      const skinSelectBtn = add([
        sprite("lvlbtn"),
        "btn",
        pos(width() / 2 - 128, height() / 2 - 128),
        area(),
      ]);

      const coinSpr = add([
        sprite("coin"),
        pos(width() * 0.8, height() * 0.05),
      ])

      const coinCount = add([
        text(coins),
        pos(width() * 0.85, height() * 0.05),
      ])

      var unlocked = false;
      if (onions[onionId] === "onion-secret") {
        for (let achievement of checkAchievements()) {
          if (achievement.name === "...") {
            unlocked = true;
            const onionSelect = add([
              sprite(onions[onionId]),
              "btn",
              pos(width() / 2 - 38, height() / 2 - 50),
              area(),
            ]);
            saveSkin(onions[onionId]);
          }
        }
        if (!unlocked) {
          const onionSelect = add([
            sprite("skinsBtn"),
            "btn",
            scale(0.421875),
            pos(width() / 2, height() / 2),
            area(),
            anchor("center"),
          ]);
          add([
            text("An achievement is required...", { size: 40 }),
            pos(width() / 2, height() * 0.7),
            anchor("center"),
          ]);
        }
      } else if (onions[onionId] === "onion-ocean") {
        for (let achievement of checkAchievements()) {
          if (achievement.name === "Explored the Depths") {
            unlocked = true;
            const onionSelect = add([
              sprite(onions[onionId]),
              "btn",
              pos(width() / 2 - 38, height() / 2 - 50),
              area(),
            ]);
            saveSkin(onions[onionId]);
          }
        }
        if (!unlocked) {
          const onionSelect = add([
            sprite("skinsBtn"),
            "btn",
            scale(0.421875),
            pos(width() / 2, height() / 2),
            area(),
            anchor("center"),
          ]);
          add([
            text("An achievement is required...", { size: 40 }),
            pos(width() / 2, height() * 0.7),
            anchor("center"),
          ]);
        }
      } else if (onions[onionId] === "onion-pumpkin") {
        // Check if the pumpkin has been bought
        pumpkinBought = hasSkin("onion-pumpkin")
        if (pumpkinBought) {
          unlocked = true;
          const onionSelect = add([
            sprite(onions[onionId]),
            "btn",
            pos(width() / 2 - 38, height() / 2 - 50),
            area(),
          ]);
          const startBtn = add([
            sprite("startbtn"),
            scale(0.421875),
            pos(width() / 2, height() * 0.7),
            anchor("center"),
          ]);
          startBtn.add([
            text("Bought", { size: 64 }),
            scale(2.37037037037),
            fixed(),
            anchor("center"),
          ]);
        } else {
          // Retrieve the user's coins and check if they have enough
          let coins = retrieveCoins();
          unlocked = true;
          const onionSelect = add([
            sprite(onions[onionId]),
            "btn",
            pos(width() / 2 - 38, height() / 2 - 50),
            area(),
          ]);
          const buyBtn = add([
            sprite("startbtn"),
            pos(width() / 2, height() * 0.7),
            anchor("center"),
            area(),
            "buyBtn"
          ]);
          buyBtn.add([
            text("$750", { size: 64 }),
            fixed(),
            anchor("center"),
          ]);
          
        }
      } else if (onions[onionId] === "onion-invert") {
        // Check if the invert has been bought
        invertBought = hasSkin("onion-invert")
        if (invertBought) {
          unlocked = true;
          const onionSelect = add([
            sprite(onions[onionId]),
            "btn",
            pos(width() / 2 - 38, height() / 2 - 50),
            area(),
          ]);
          const startBtn = add([
            sprite("startbtn"),
            scale(0.421875),
            pos(width() / 2, height() * 0.7),
            anchor("center"),
          ]);
          startBtn.add([
            text("Bought", { size: 64 }),
            scale(2.37037037037),
            fixed(),
            anchor("center"),
          ]);
        } else {
          // Retrieve the user's coins and check if they have enough
          let coins = retrieveCoins();
          unlocked = true;
          const onionSelect = add([
            sprite(onions[onionId]),
            "btn",
            pos(width() / 2 - 38, height() / 2 - 50),
            area(),
          ]);
          const buyBtn = add([
            sprite("startbtn"),
            pos(width() / 2, height() * 0.7),
            anchor("center"),
            area(),
            "buyBtn"
          ]);
          buyBtn.add([
            text("$1,250", { size: 64 }),
            fixed(),
            anchor("center"),
          ]);
          
        }
      } else {
        unlocked = true;
        saveSkin(onions[onionId])
        const onionSelect = add([
          sprite(onions[onionId]),
          "btn",
          pos(width() / 2 - 38, height() / 2 - 50),
          area()
        ]);
      }

      const leftArrow = add([
        sprite("arrowl"),
        "l",
        area({ scale: 2 }),
        pos(width() * 0.3 - 32, height() / 2 - 64),
      ]);

      var rightArrow = add([
        sprite("arrowr"),
        "r",
        area({ scale: 2 }),
        pos(width() * 0.7 - 32, height() / 2 - 64),
      ]);

      onClick("r", () => {
        if (onionId == (onions.length - 1)) {
          onionId = 0;
        } else {
          onionId++;
        }
        go("skins");
      });
      onClick("l", () => {
        if (onionId == 0) {
          onionId = (onions.length - 1);
        } else {
          onionId--;
        }
        go("skins");
      });
      
      onClick("btn", () => {
        if(coins >= 750 && onions[onionId] == "onion-pumpkin" && !hasSkin("onion-pumpkin")){
          saveSkin(onions[onionId]);
          storeCoins(coins - 750);
        } else if(coins >= 1250 && onions[onionId] == "onion-invert" && !hasSkin("onion-invert")){
          saveSkin(onions[onionId]);
          storeCoins(coins - 1250);
        }
        if (!unlocked || !hasSkin(onions[onionId])) {
          onionId = 0;
        }
        go("game");
      });
    });


    scene("multiplayer", () => {
      onKeyPress('b', () => {
        go("title");
      })

      add([
        text("Multiplayer", { size: 120 }),
        color(255, 255, 255),
        fixed(),
        pos(width() / 2 - 395, height() * 0.05),
      ])

      const onOffBtn = add([
        // list of components
        sprite("lvlbtn"),
        "btn",
        pos(width() / 2 - 128, height() / 2 - 128),
        area(),

      ])
      if (multiplayerEnabled) {
        const onOffText = add([
          // list of components
          text("ON", { size: 100 }),
          "txt",
          pos(width() / 2 - 56, height() / 2 - 34),
          area(),

        ])
      } else {
        const onOffText = add([
          // list of components
          text("OFF", { size: 100 }),
          "txt",
          pos(width() / 2 - 86, height() / 2 - 34),
          area(),
          "onOff"
        ])
      }

      const leftArrow = add([
        sprite("arrowl"),
        "l",

        area({ scale: 2, }),
        pos(width() * 0.3 - 32, height() / 2 - 64),
      ])

      var rightArrow = add([
        sprite("arrowr"),
        "r",
        area({ scale: 2, }),
        pos(width() * 0.7 - 32, height() / 2 - 64),
      ])

      onClick("r", () => {
        multiplayerEnabled = !multiplayerEnabled;
        go("multiplayer");
      })
      onClick("l", () => {
        multiplayerEnabled = !multiplayerEnabled;
        go("multiplayer");
      })
      onClick("onOff", () =>{
        go("game");
      })
    })
    var highestId = 0;
    // scene("piracy", () => {
    //   add([
    //     // list of components
    //     sprite("nopiracy"),
    //     pos(width() / 2 - 115, height() / 2 + 50),
    //   ])

    //   add([
    //     text("Onion doesn't like", {size: 120}),
    //     layer("title"),
    //     color(255, 255, 255),
    //     fixed(),
    //     pos(width() / 2 - 651, height() * 0.10),
    //   ])
    //   add([
    //     text("pirates.", {size: 120}),
    //     layer("title"),
    //     color(255, 0, 0),
    //     fixed(),
    //     pos(width() / 2 - 275, height() * 0.30),
    //   ])
    //   onKeyPress("h", () => {
    //     onKeyPress("q", () => {
    //       go("title");
    //     })
    //   })
    // })


    scene("winSpins", () => {
      const spins = getWinSpins();
      let isSpinning = false; // Flag to check if spinning is in progress
      let isPrizeReady = false; // Flag to check if prize is ready to be accepted

      add([
        text("WinSpins", { size: 64 }),
        pos(40, 40),
      ]);

      const spinCount = add([
        text(`Available Spins: ${spins}`, { size: 48 }),
        pos(40, 120),
      ]);

      const underPrizeBtn = add([
        sprite("lvlbtn"),
        pos(width() / 2, height() / 2),
        scale(1.15),
        area(),
        anchor("center"),
        "underPrizeBtn",
      ]);

      const prizeSprite = add([
        sprite("invisdanger"),
        pos(width() / 2, height() / 2),
        anchor("center"),
      ]);

      underPrizeBtn.prizeText = add([
        text("SPIN", { size: 40 }),
        pos(width() / 2, height() / 2),
        anchor("center"),
      ]);

      underPrizeBtn.collectText = add([
        text("", { size: 20 }),
        pos(width() / 2, height() / 2 + 40),
        anchor("center"),
      ]);

      const prizes = ["coins", "skin", "winSpin"];
      const prizeSprites = ["coin", "onion-beach", "portal", "onion-blue", "onion-dark", "onion-gold", "onion-watermelon", "onion-eggplant", "onion-magic", "onion-pumpkin", "onion-invert", "onion-ocean"];

      function animateSpin(callback) {
        let index = 0;
        const animationDuration = 2000; // total duration of the animation
        const intervalDuration = 100; // interval between sprite changes
        const totalIntervals = animationDuration / intervalDuration;

        const interval = setInterval(() => {
          prizeSprite.use(sprite(prizeSprites[index % prizeSprites.length]));
          underPrizeBtn.prizeText.text = "";
          index++;
        }, intervalDuration);

        setTimeout(() => {
          clearInterval(interval);
          callback();
        }, animationDuration);
      }

      onClick("underPrizeBtn", () => {
        if (isSpinning || isPrizeReady) return; // Prevent button action if spinning or prize is ready
        if (useWinSpin()) {
          isSpinning = true; // Set spinning flag to true
          underPrizeBtn.opacity = 0.5; // Grey out the button
          animateSpin(() => {
            const prize = prizes[Math.floor(Math.random() * prizes.length)];
            switch (prize) {
              case "coins":
                prizeSprite.use(sprite("coin"));
                underPrizeBtn.prizeText.text = "COINS";
                break;
              case "skin":
                const randomSkin = "onion-" + ["beach", "blue", "dark", "gold", "watermelon", "eggplant", "magic", "pumpkin", "invert", "ocean"][Math.floor(Math.random() * 11)];
                prizeSprite.use(sprite(randomSkin));
                underPrizeBtn.prizeText.text = "SKIN";
                break;
              case "winSpin":
                prizeSprite.use(sprite("portal"));
                underPrizeBtn.prizeText.text = "WINSPIN";
                break;
            }
            underPrizeBtn.prizeText.pos.y = (prizeSprite.height / 2) + (height() / 2) + 40;
            underPrizeBtn.collectText.pos.y = (prizeSprite.height / 2) + (height() / 2) + 80;
            underPrizeBtn.collectText.text = "COLLECT";
            spinCount.text = `Available Spins: ${getWinSpins()}`;
            isSpinning = false; // Reset spinning flag to false
            isPrizeReady = true; // Set prize ready flag to true
            underPrizeBtn.opacity = 1; // Restore button opacity
          });
        } else {
          alert("No WinSpins available!");
        }
      });

      onClick("underPrizeBtn", () => {
        if (!isPrizeReady) return; // Prevent accepting prize if not ready
        const prizeText = underPrizeBtn.prizeText.text;
        switch (prizeText) {
          case "COINS":
            addCoin();
            break;
          case "SKIN":
            const skinSprite = prizeSprite.sprite;
            saveSkin(skinSprite.name);
            break;
          case "WINSPIN":
            addWinSpin();
            break;
        }
        underPrizeBtn.prizeText.text = "SPIN"; // Reset button text
        underPrizeBtn.collectText.text = ""; // Reset collect text
        isPrizeReady = false; // Reset prize ready flag
      });

      onKeyPress('b', () => {
        go("title");
      });
    });



    

    scene("achievements", () =>{
      onKeyPress('b', () => {
        go("title");
      })
      add([
        text("Achievements", { size: 64 }),
        color(255, 255, 255),
        fixed(),
        pos(40, 40),
      ])
      //for each sprite in checkAchievements(), add a sprite with the achievement
      //add a text with the achievement name
      //add a text with the achievement description

      var index = 0
      for (let achievement of checkAchievements()) {
        var achSprite = add([
          sprite(achievement.sprite),
          scale(2),
          pos(20 + (index*150), height() / 2 - 128),
        ])
        var achName = add([
          text(achievement.name, {
            width: 64 * 2,
            size: 30,
          }),
          pos(20 + (index*150), achSprite.pos.y + 140),
        ])
        add([
          text(achievement.description, {
            width: 64 * 2,
            size: 15,
          }),
          pos(20 + (index*150), achSprite.pos.y + 160 + (achName.text.length * 10)),
        ])
        index++;
      }
    })

    /*
    scene("dj", () => {
      const music = play("OverworldlyFoe", {
        volume: 1,
        loop: true
      })
      music.play()
      const wheelSize = 100; // Size of the control wheels
      const wheelSpacing = 50; // Spacing between the wheels
      const wheelCenterY = height() / 2; // Y position for all wheels
      const wheelSpeed = 0.1; // Speed of wheel rotation

      const wheels = [
        { name: "Volume", value: 0, min: 0, max: 1, step: 0.1 },
        { name: "Speed", value: 1, min: 0.5, max: 2, step: 0.1 },
        { name: "Detune", value: 0, min: -1200, max: 1200, step: 100 },
      ];

      const wheelSprites = [];

      // Create the control wheels
      wheels.forEach((wheel, index) => {
        const wheelSprite = add([
          sprite("dj"),
          area(),
          pos((index + 1) * (wheelSize + wheelSpacing), wheelCenterY),
          anchor("center"),
          rotate(0),
          wheel,
        ]);
        wheelSprites.push(wheelSprite);
      });

      // Function to modify the sound based on the wheel values
      function modifySound() {
        const volume = wheelSprites[0].value;
        const speed = wheelSprites[1].value;
        const detune = wheelSprites[2].value;

        // Apply the modifications to the sound
        music.volume(volume);
        music.speed(speed);
        music.detune(detune);
      }

      // Update the sound modification on each frame
      action(() => {
        modifySound();
      });

      // Mouse movement and click events to control the wheels
      let wheelIndex = 0; // Index of the active wheel

      onMouseMove(() => {
        wheelIndex = Math.floor(mousePos().x / (wheelSize + wheelSpacing));
      });

      onMousePress(() => {
        const activeWheel = wheelSprites[wheelIndex];
        const scrollDelta = mousePos().y - activeWheel.pos.y;

        // Update the wheel value based on the scroll direction and step
        const { value, min, max, step } = activeWheel;

        if (scrollDelta > 0) {
          activeWheel.value = Math.min(value + step, max);
        } else if (scrollDelta < 0) {
          activeWheel.value = Math.max(value - step, min);
        }
      });
    }) 
    */
    // if ((window.matchMedia('(display-mode: fullscreen)').matches || window.navigator.fullscreen) || (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone)) {
    go("title");
    // }
