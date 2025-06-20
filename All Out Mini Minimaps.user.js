// ==UserScript==
// @name         All Out Mini Minimaps
// @namespace    https://github.com/larnak/AllOutHell-userscripts
// @version      11.4
// @description  A horrible minimap, ugly yet effective and smaller. Now with player position!
// @author       Someone Who Isnt Me (with modifications from larnak)
// @match        https://www.allouthell.com/game.php
// @match        https://allouthell.com/game.php
// @updateURL    https://github.com/larnak/AllOutHell-userscripts/raw/refs/heads/main/All%20Out%20Mini%20Minimaps.user.js
// @downloadURL  https://github.com/larnak/AllOutHell-userscripts/raw/refs/heads/main/All%20Out%20Mini%20Minimaps.user.js
// @grant        none
// ==/UserScript==

// Things to do: fix Roja map, some of the locations are not as they are on the wiki - fix colors for every building type

//Here we go..

(function() {
    'use strict';

    // Function to extract suburb name
    function getCurrentSuburbName() {
        let suburbElement = document.querySelector('#rightcolumn .bumper b');
        if (suburbElement) {
            return suburbElement.textContent.trim();
        }
        return null;
    }

    // *** MODIFIED FUNCTION ***
    // NEW: Function to extract the player's current location name and coordinates from the "div.room" element
    function getCurrentLocationName() {
        // Find the div with the class "room"
        const locationElement = document.querySelector('div.room');

        if (locationElement) {
            const fullText = locationElement.textContent; // e.g., "You are currently at Lynch Street. (514, 519)"

            // Use a regular expression to extract the text between "at " and the following period "."
            const match = fullText.match(/(?:at|inside|outside)\s(.*?)\./);

            // If a match is found, match[1] will contain the captured group (the location name)
            if (match && match[1]) {
                return match[1].trim(); // Returns "Lynch Street"
            }
        }
        // If the element or the pattern is not found, return null
        return null;
    }

    // Function to extract coordinates from the location text
    function getCurrentLocationCoordinates() {
        const locationElement = document.querySelector('div.room');

        if (locationElement) {
            const fullText = locationElement.textContent; // e.g., "You are currently at Lynch Street. (514, 519)"

            // Use a regular expression to extract coordinates in parentheses
            const coordMatch = fullText.match(/\((\d+),\s*(\d+)\)/);

            if (coordMatch) {
                return {
                    x: parseInt(coordMatch[1]),
                    y: parseInt(coordMatch[2])
                };
            }
        }
        return null;
    }

    // Function to get player position - uses coordinates if available, otherwise name matching
    function getPlayerPosition(suburb, mapData) {
        const coordinates = getCurrentLocationCoordinates();
        
        if (coordinates) {
            // If we have coordinates, calculate the position on the map
            const suburbCoords = getSuburbCoordinates(suburb);
            const relativeX = coordinates.x - suburbCoords.x;
            const relativeY = coordinates.y - suburbCoords.y;
            
            // Check if the calculated position is within the map bounds
            if (relativeY >= 0 && relativeY < mapData.length && 
                relativeX >= 0 && relativeX < mapData[0].length) {
                return { row: relativeY, col: relativeX };
            }
        }
        
        // Fall back to name matching if coordinates aren't available or are out of bounds
        const playerLocationName = getCurrentLocationName();
        if (playerLocationName) {
            for (let i = 0; i < mapData.length; i++) {
                for (let j = 0; j < mapData[i].length; j++) {
                    if (mapData[i][j].name === playerLocationName) {
                        return { row: i, col: j };
                    }
                }
            }
        }
        
        return null; // Player position not found
    }

    // Create the map container
    let mapContainer = document.createElement('div');
    mapContainer.id = 'custom-map-container';
    mapContainer.style.position = 'absolute';
    mapContainer.style.width = '300px';
    mapContainer.style.height = '300px';
    mapContainer.style.backgroundColor = 'white';
    mapContainer.style.border = '1px solid black';
    mapContainer.style.zIndex = '9999';
    mapContainer.style.overflow = 'hidden';

    // Find the rightcolumn and stats elements
    let rightcolumn = document.getElementById('rightcolumn');
    let stats = document.querySelector('.stats');

    // Check if both elements exist before appending
    if (rightcolumn && stats) {
        // Append mapContainer to rightcolumn, above stats
        rightcolumn.insertBefore(mapContainer, stats);
        // Add top margin to the stats element
        stats.style.marginTop = '300px';
    } else {
        console.error('Could not find rightcolumn or stats element.');
        // Append mapContainer to the document body as a fallback
        document.body.appendChild(mapContainer);
        // Apply margin top to stats if it exists in the body
        if (stats) {
            stats.style.marginTop = '300px';
        }
    }

    // Create the map grid based on current suburb
    let currentSuburb = getCurrentSuburbName();
    let mapData = getMapDataForSuburb(currentSuburb);

    if (!mapData) {
        console.error('Map data not found for suburb:', currentSuburb);
        return;
    }

    // Get player's position using coordinates or name matching
    let playerPosition = getPlayerPosition(currentSuburb, mapData);

    let mapGrid = document.createElement('table');
    mapGrid.id = 'custom-map-grid';
    mapGrid.style.width = '100%';
    mapGrid.style.height = '100%';
    mapGrid.style.borderCollapse = 'collapse';
    mapGrid.style.pointerEvents = 'auto'; // Allow interaction with the grid
    mapContainer.appendChild(mapGrid);

    // Generate the map
    for (let i = 0; i < mapData.length; i++) {
        let tr = document.createElement('tr');
        for (let j = 0; j < mapData[i].length; j++) {
            let cell = mapData[i][j];
            let td = document.createElement('td');
            td.className = 'custom-map-cell';
            // Check if this is the player's current position
            if (playerPosition && playerPosition.row === i && playerPosition.col === j) {
                // This is the player's current location, give it a special color
                td.style.backgroundColor = '#FF00FF'; // Bright pink/magenta
                td.style.border = '2px solid #000000'; // Extra border to make it pop
            } else {
                // Otherwise, use the standard color for the building type
                td.style.backgroundColor = getColorByType(cell.type);
            }

            // Calculate coordinates for this cell
            const coords = getCellCoordinates(currentSuburb, i, j);
            td.title = `${cell.name} (${coords.x}, ${coords.y})`; // Show name and coordinates in tooltip
            td.textContent = ''; // This line ensures the cell is blank

            // Make the cell clickable and link it to the wiki in a new window
            td.addEventListener('click', () => {
                // Use the custom link if available, otherwise generate from name
                const wikiLink = cell.link ? cell.link : cell.name;
                window.open('https://all-out-hell.fandom.com/wiki/' + encodeURIComponent(wikiLink), '_blank', 'noopener,noreferrer');
            });

            tr.appendChild(td);
        }
        mapGrid.appendChild(tr);
    }

    // Function to get suburb coordinates (top-left corner)
    function getSuburbCoordinates(suburb) {
        switch (suburb) {
            case 'Roja':
                return { x: 500, y: 490 };
            case 'Elgin':
                return { x: 500, y: 500 };
            case 'Beachwood':
                return { x: 510, y: 500 };
            case 'Fairview Heights':
                return { x: 500, y: 510 };
            case 'Rockwell':
                return { x: 510, y: 510 }; 
            case 'Mulston':
                return { x: 520, y: 510 };
            case 'Glimmer Fields':
                return { x: 520, y: 500 };
            default:
                return { x: 0, y: 0 }; // Default coordinates
        }
    }

    // Function to get coordinates for a specific cell
    function getCellCoordinates(suburb, row, col) {
        const suburbCoords = getSuburbCoordinates(suburb);
        return {
            x: suburbCoords.x + col,
            y: suburbCoords.y + row
        };
    }

    // Function to get map data based on suburb
    function getMapDataForSuburb(suburb) {
        // Define map data for each suburb here
        switch (suburb) {
                case 'Roja':
            return [
                [{type: 'cemetery', name: 'Dyer Cemetery'}, {type: 'cemetery', name: 'Dyer Cemetery'}, {type: 'street', name: 'That Street'}, {type: 'store', name: "Jason's Sports Wares"}, {type: 'funeral', name: 'Last Breath Funeral'}, {type: 'transport', name: 'Underground Train Station'}, {type: 'store', name: "Dr. Jame's Practice"}, {type: 'god', name: 'Cult of Hiei'}, {type: 'store', name: 'Cannonballs Deep'}, {type: 'fire', name: 'Grime City Fire Department'}],
                [{type: 'park', name: 'Goblin Park'}, {type: 'hospital', name: 'Goblin General'}, {type: 'parking', name: 'Parking Lot'}, {type: 'park', name: 'A Lonely Hill'}, {type: 'street', name: 'Left Street'}, {type: 'theatre', name: 'It Froze Theatre'}, {type: 'morgue', name: 'Morningside Morgue'}, {type: 'park', name: 'Drakaasi Park'}, {type: 'bar', name: 'Drinkwater & Bramble'}, {type: 'street', name: 'River Styx Street'}],
                [{type: 'parking', name: 'Parking Lot'}, {type: 'street', name: 'Pine Street'}, {type: 'store', name: 'Grohls'}, {type: 'street', name: 'Treat Street'}, {type: 'food', name: 'No Bueno'}, {type: 'parking', name: 'Parking Lot'}, {type: 'gym', name: 'Swole Gym'}, {type: 'street', name: 'Poor Street'}, {type: 'street', name: 'North Red Street'}, {type: 'laundry', name: 'Bubble Laundry'}],
                [{type: 'store', name: 'Mako Flowers'}, {type: 'street', name: 'Pine Street'}, {type: 'parking', name: 'Parking Lot'}, {type: 'park', name: 'Grass Field'}, {type: 'storage', name: 'Basement Vault'}, {type: 'waste', name: 'Wasteland'}, {type: 'casion', name: 'Grime Time Casino'}, {type: 'casino', name: 'Grime Time Casino'}, {type: 'parking', name: 'Parking Lot'}, {type: 'detective', name: "Peeker's Private Eye"}],
                [{type: 'waste', name: 'Wasteland'}, {type: 'food', name: "Vendetta's Italian Cuisine"}, {type: 'cops', name: 'Grime City Police'}, {type: 'street', name: 'Purple Street'}, {type: 'store', name: 'Rust Cuts'}, {type: 'work', name: 'Work Site'}, {type: 'parking', name: 'Parking Lot'}, {type: 'tarot', name: 'Scorpio Stellium Tarot'}, {type: 'street', name: 'Red Street'}, {type: 'street', name: 'Blue Ave'}],
                [{type: 'home', name: 'The Whitechapel House'}, {type: 'street', name: 'Done Street'}, {type: 'donut', name: 'Sundown Donut'}, {type: 'waste', name: 'Wasteland'}, {type: 'park', name: 'Soil Park'}, {type: 'street', name: 'Dirt Boulevard'}, {type: 'bar', name: 'Zero Below'}, {type: 'store', name: 'Seven Sins'}, {type: 'street', name: 'Red Street'}, {type: 'store', name: "Koma's Kosplay"}],
                [{type: 'street', name: 'Above Street'}, {type: 'gas', name: "Hell'vron"}, {type: 'powersub', name: 'Roja Relay Station'}, {type: 'bar', name: 'Club Lumina'}, {type: 'store', name: "Leymur's"}, {type: 'store', name: 'Doggy Style Pet Grooming'}, {type: 'cemetery', name: 'Pet Sematary'}, {type: 'transport', name: 'Roja Subway Station'}, {type: 'street', name: 'Red Street'}, {type: 'waste', name: 'Wasteland'}],
                [{type: 'butcher', name: "Kreuger's Butcher Shop"}, {type: 'street', name: 'Between Street'}, {type: 'store', name: 'RNG Jewelry'}, {type: 'street', name: 'Grove Street'}, {type: 'store', name: "Spin T' Win"}, {type: 'hole', name: 'A Strange Hole'}, {type: 'store', name: 'Nerve Ending Dentistry'}, {type: 'chicken', name: "Chick De' Cay"}, {type: 'transport', name: 'Red Street'}, {type: 'waste', name: 'Wasteland'}],
                [{type: 'food', name: 'Panic! Drive-In'}, {type: 'parking', name: 'Parking Lot'}, {type: 'store', name: 'Post Office'}, {type: 'store', name: "Nixon's Fixin's"}, {type: 'parking', name: 'Parking Lot'}, {type: 'store', name: "Ray's Occult Books"}, {type: 'street', name: 'North Moore Street'}, {type: 'street', name: 'Mage Street'}, {type: 'food', name: "The Slaughtered Lamb"}, {type: 'cornerstore', name: "B.J.'s Corner"}],
                [{type: 'waste', name: 'Wasteland'}, {type: 'street', name: 'Clint Street'}, {type: 'parking', name: 'Parking Lot'}, {type: 'park', name: 'Fort Barnes Park'}, {type: 'gas', name: 'Shabadoo Gas'}, {type: 'street', name: 'Grommet Street'}, {type: 'street', name: 'Moore Street'}, {type: 'waste', name: 'Wasteland'}, {type: 'storage', name: "Grandma's Storage"}, {type: 'park', name: 'Elm Park'}],
             ];
                case 'Elgin':
            return [
                [{type: 'god', name: 'The Church Of Resurrection'}, {type: 'street', name: 'Clark Street'}, {type: 'work', name: 'Work Site'}, {type: 'junk', name: "Dumptruck's Junk"}, {type: 'museum', name: 'Museum of Egyptian Antiquities'}, {type: 'waste', name: 'Garbageland Dump'}, {type: 'street', name: 'Connelly Street'}, {type: 'fire', name: 'Connelly Fire Department'}, {type: 'cops', name: 'Mcrae Police Department'}, {type: 'street', name: 'Elm Street'}],
                [{type: 'street', name: 'Jarman Street'}, {type: 'fort', name: 'Fort Barnes Storehouse'}, {type: 'fort', name: 'Fort Barnes Infirmary'}, {type: 'fort', name: 'Fort Barnes Vehicle Depot'}, {type: 'street', name: 'Wallace Street'}, {type: 'store', name: "Mckee's Electronics"}, {type: 'street', name: 'Haig Street'}, {type: 'store', name: "Paugh Jewelry"}, {type: 'street', name: 'Mcrae Avenue'}, {type: 'donut', name: 'Rusties'}],
                [{type: 'cemetery', name: 'Hooper Cemetery'}, {type: 'fort', name: 'Fort Barnes Barracks'}, {type: 'fort', name: 'Fort Barnes Armory'}, {type: 'fort', name: 'Fort Barnes Training Ground'}, {type: 'food', name: "Barshilad's"}, {type: 'parking', name: 'A Parking Lot'}, {type: 'suicide', name: 'Rooker Building'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'waste', name: 'Wasteland'}, {type: 'suicide', name: 'Taylor Building'}],
                [{type: 'store', name: 'Hagman Salon'}, {type: 'fort', name: 'Fort Barnes Mess Hall'}, {type: 'fort', name: 'Fort Barnes Gate'}, {type: 'fort', name: 'Fort Barnes Exercise Yard'}, {type: 'garage', name: "Keith's Auto Repair"}, {type: 'street', name: 'Quigley Street'}, {type: 'god', name: 'A Synagogue'}, {type: 'park', name: 'Santiago Park'}, {type: 'suicide', name: 'Barton Building'}, {type: 'store', name: 'The Silver Age Comic Shop'}],
                [{type: 'bar', name: "Bastard's Battalion Bar"}, {type: 'street', name: 'Brezzi Street'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'street', name: 'Atkins Street'}, {type: 'gas', name: "Keegan's Gas Station"}, {type: 'work', name: 'A Worksite'}, {type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'mansion', name: 'Yrrict Mansion'}, {type: 'bar', name: 'The Maid Club'}, {type: 'street', name: 'Redtman Lane'}],
                [{type: 'street', name: 'Corvino Street'}, {type: 'store', name: 'Skull And Buns Bakery'}, {type: 'street', name: 'Macniel Street'}, {type: 'suicide', name: 'Blair Building'}, {type: 'street', name: 'Clive Street'}, {type: 'store', name: "Kerri-Ann's Exotic Pets"}, {type: 'parking', name: 'A Parking Lot'}, {type: 'museum', name: 'Ashtear Library'}, {type: 'street', name: 'Karloff Lane'}, {type: 'store', name: 'MGH Furniture'}],
                [{type: 'work', name: 'A Work Site'}, {type: 'cops', name: 'Corvino Police Department'}, {type: 'store', name: 'Crosby Sporting Goods'}, {type: 'street', name: 'Hodder Street'}, {type: 'hole', name: 'Destroyed Helix Building'}, {type: 'hospital', name: 'Elgin General Hospital'}, {type: 'super', name: 'Magnus Groceries'}, {type: 'super', name: 'Magnus Groceries'}, {type: 'business', name: 'Iscariot Hotel'}, {type: 'parking', name: 'A Parking Lot'}],
                [{type: 'park', name: 'Barret Park'}, {type: 'suicide', name: 'Gandler Building'}, {type: 'street', name: 'Price Street'}, {type: 'sushi', name: "Yasunori's Sushi"}, {type: 'clothes', name: "Walter's Formal Wear"}, {type: 'street', name: 'Effendy Street'}, {type: 'store', name: 'Woolmer T-shirts'}, {type: 'street', name: 'Silva Boulevard'}, {type: 'street', name: 'Squib Avenue'}, {type: 'bar', name: 'The Warg'}],
                [{type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'powersub', name: 'Elgin Relay Station'}, {type: 'store', name: "Lee's Hardware"}, {type: 'suicide', name: 'Cochrane Building'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'storage', name: 'Stacey Bank'}, {type: 'work', name: 'A Worksite'}, {type: 'mall', name: 'Englund Mall'}, {type: 'mall', name: 'Englund Mall'}, {type: 'store', name: 'Argento Theatre'}],
                [{type: 'school', name: 'Robert Wise High'}, {type: 'school', name: 'Robert Wise High'}, {type: 'factory', name: 'A Factory'}, {type: 'guns', name: "Johnny's s and Americana"}, {type: 'street', name: 'Vuris Street'}, {type: 'gas', name: "Will's Gas Station"}, {type: 'store', name: "Big Vitor's Electronics"}, {type: 'mall', name: 'Englund Mall'}, {type: 'mall', name: 'Englund Mall'}, {type: 'street', name: 'Priin Street'}]
            ];
                case 'Beachwood':
            return [
                [{type: 'store', name: 'Hairy Eyeball Detective Agency'}, {type: 'street', name: 'Mean Street'}, {type: 'suicide', name: 'Brunet Building'}, {type: 'street', name: 'Hobson Street'}, {type: 'factory', name: 'A Warehouse'}, {type: 'store', name: 'Leviathan Security'}, {type: 'waste', name: 'A Wasteland'}, {type: 'street', name: 'Scrimm Street'}, {type: 'suicide', name: 'Coscarelli Building'}, {type: 'vet', name: "Tyr's Veterinary Clinic"}],
                [{type: 'park', name: 'Brunet Park'}, {type: 'storage', name: 'Virtue Bank'}, {type: 'food', name: "Zuccaro's"}, {type: 'cops', name: 'Sondergaard Police Department'}, {type: 'food', name: "Chen's Chinese Buffet"}, {type: 'factory', name: 'A Warehouse'}, {type: 'work', name: 'A Worksite'}, {type: 'store', name: "Jodie's Dancewear"}, {type: 'street', name: 'Sydow Street'}, {type: 'parking', name: 'A Parking Lot'}],
                [{type: 'factory', name: 'A Factory'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'fire', name: 'Barrymore Fire Department'}, {type: 'factory', name: 'A Factory'}, {type: 'store', name: "Ankers Dentistry"}, {type: 'street', name: 'Moran Lane'}, {type: 'store', name: "Sandweiss Furniture"}, {type: 'store', name: "The Mimery"}, {type: 'store', name: "Final Hits Records"}, {type: 'factory', name: 'A Warehouse'}],
                [{type: 'factory', name: 'A Factory'}, {type: 'arcade', name: "Nightrunner Arcade"}, {type: 'street', name: 'Sondergaard Street'}, {type: 'store', name: "EJ Well's Hardware"}, {type: 'street', name: 'Elmdale Street'}, {type: 'food', name: "Manuel's Taco Stand"}, {type: 'store', name: "Savini Funeral Home"}, {type: 'street', name: 'Bannister Street'}, {type: 'gas', name: "Halo Gas"}, {type: 'parking', name: 'A Parking Lot'}],
                [{type: 'street', name: 'Rathbone Avenue'}, {type: 'street', name: 'Barrymore Avenue'}, {type: 'park', name: 'Tracy Park'}, {type: 'street', name: 'Massey Street'}, {type: 'bar', name: "Bruce Greene's Dive Bar"}, {type: 'street', name: 'Loomis Street'}, {type: 'store', name: "Hypnotist Sinclair's Magic"}, {type: 'morg', name: "Spicy Bones Morgue"}, {type: 'club', name: "Uncle Roly's Bowling"}, {type: 'street', name: 'Warbeck Street'}],
                [{type: 'museum', name: 'Hegedus Library'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'museum', name: 'Museum Of Science And Nature'}, {type: 'street', name: 'Regency Street'}, {type: 'cemetery', name: 'Wytch Hollow Cemetery'}, {type: 'cemetery', name: 'Wytch Hollow Cemetery'}, {type: 'factory', name: 'Racoon Hill factory'}, {type: 'suicide', name: 'Don Durk Hotel'}, {type: 'museum', name: 'Collas Library'}],
                [{type: 'store', name: "Weeaboo Market"}, {type: 'street', name: 'Stroheim Street'}, {type: 'suicide', name: 'Bogart Building'}, {type: 'store', name: "Funny Opossum Joke Shop"}, {type: 'parking', name: 'A Parking Lot'}, {type: 'suicide', name: 'Barbeau Building'}, {type: 'powersub', name: 'Beachwood Relay Station'}, {type: 'store', name: "Overtime Sports"}, {type: 'street', name: 'Spinell Street'}, {type: 'food', name: "Badziew Pizza"}],
                [{type: 'street', name: 'Roundtree Road'}, {type: 'store', name: "Happies Salon"}, {type: 'street', name: 'Edwards Road'}, {type: 'hospital', name: 'Edwards Hospital'}, {type: 'gas', name: "GGoA Petrol"}, {type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'street', name: 'Gordon Lane'}, {type: 'laz', name: 'Helix Building', link: 'Helix Building (Beachwood)'}, {type: 'school', name: 'Gulager High'}, {type: 'school', name: 'Gulager High'}],
                [{type: 'gas', name: "Z'dar Gasoline"}, {type: 'store', name: "Ye Olde Weapons Shop"}, {type: 'storage', name: "Apex Bank"}, {type: 'garage', name: "Good Month Automotive"}, {type: 'street', name: 'Mason Avenue'}, {type: 'super', name: "Super B Groceries"}, {type: 'super', name: "Super B Groceries"}, {type: 'suicide', name: "Wallace Building"}, {type: 'street', name: 'Frost Street'}, {type: 'parking', name: 'A Parking Lot'}],
                [{type: 'garage', name: "Elite Repairs"}, {type: 'food', name: "Chung's Asian Fusion"}, {type: 'street', name: 'Frye Street'}, {type: 'bar', name: "Kitty Club"}, {type: 'cops', name: "Mason Police Department"}, {type: 'bar', name: "The Fuzz"}, {type: 'parking', name: 'Parking Lot'}, {type: 'store', name: "Fulci Cinema"}, {type: 'apothecary', name: "Rosello's Pharmacy"}, {type: 'street', name: 'Lovelock Road'}],
            ];
                case 'Fairview Heights':
            return [
                [{type: 'cemetery', name: 'Romero Cemetery'}, {type: 'cemetery', name: 'Romero Cemetery'}, {type: 'cemetery', name: 'Romero Cemetery'}, {type: 'cemetery', name: 'Romero Cemetery'}, {type: 'god', name: 'Church'}, {type: 'store', name: 'Stroud Funeral Home'}, {type: 'factory', name: 'A Warehouse'}, {type: 'factory', name: 'A Factory'}, {type: 'food', name: "Remy's Poutine Shop"}, {type: 'factory', name: "Tom's factory Buy And Sell"}],
                [{type: 'cemetery', name: 'Romero Cemetery'}, {type: 'cemetery', name: 'Romero Cemetery'}, {type: 'cemetery', name: 'Romero Cemetery'}, {type: 'cemetery', name: 'Romero Cemetery'}, {type: 'street', name: 'Howling Moon Avenue'}, {type: 'laz', name: 'Helix Building', link: 'Helix Building (Fairview Heights)'}, {type: 'bar', name: "Reverend Larry's Bar"}, {type: 'cops', name: 'Deodato Police Department'}, {type: 'street', name: 'Deodato Street'}, {type: 'cornerstore', name: 'Dwyer Provider'}],
                [{type: 'street', name: 'Sutherland Street'}, {type: 'gas', name: 'Royal Reptile Gasoline'}, {type: 'fire', name: 'Flanagan Fire Department'}, {type: 'hospital', name: 'Saint Ingaborg Hospital'}, {type: 'suicide', name: 'Rollins Building'}, {type: 'museum', name: 'Hiltzik Library'}, {type: 'street', name: 'Strong Street'}, {type: 'storage', name: 'Veritech Bank'}, {type: 'car', name: 'Union Storage'}, {type: 'car', name: 'Union Storage'}],
                [{type: 'street', name: 'Jackson Street'}, {type: 'store', name: "Ben 's Pet Shelter"}, {type: 'clothes', name: "Yeti's Costume Shop"}, {type: 'store', name: 'TerraAqua plants'}, {type: 'street', name: 'Flanagan Street'}, {type: 'school', name: 'Finnegan Highschool'}, {type: 'school', name: 'Finnegan Highschool'}, {type: 'apothecary', name: 'Green Man Health'}, {type: 'car', name: 'Union Storage'}, {type: 'car', name: 'Union Storage'}],
                [{type: 'bar', name: 'The Jelly Moon'}, {type: 'stadium', name: 'Landis Stadium Locker Room'}, {type: 'stadium', name: 'Landis Stadium Skybox'}, {type: 'stadium', name: 'Landis Stadium Locker Room'}, {type: 'clothes', name: "Possums Sports Memorabilia"}, {type: 'street', name: 'Bertino Lane'}, {type: 'store', name: 'Perfect Hair Forever Salon'}, {type: 'club', name: "Vinny's Bowling"}, {type: 'store', name: 'Hot Oven Bakery'}, {type: 'clothes', name: 'Classy Formalwear'}],
                [{type: 'store', name: "Mike's Furniture Store"}, {type: 'stadium', name: 'Landis Stadium Storeroom'}, {type: 'stadiumfield', name: 'Landis Stadium Field'}, {type: 'stadium', name: 'Landis Stadium Guard Center'}, {type: 'bar', name: 'Gentlemen Of Football club'}, {type: 'home', name: 'House'}, {type: 'suicide', name: 'Zane Hotel'}, {type: 'store', name: 'We Repair It Electronics'}, {type: 'museum', name: 'Revolutionary Museum'}, {type: 'street', name: 'Yelchin Street'}],
                [{type: 'street', name: 'Combs Street'}, {type: 'stadium', name: 'Landis Stadium Gift Shop'}, {type: 'stadium', name: 'Landis Stadium Gates'}, {type: 'stadium', name: 'Landis Stadium Concessions'}, {type: 'club', name: 'Night of the Stormrider'}, {type: 'parktopleft', name: 'Murphy Park'}, {type: 'parktopright', name: 'Murphy Park'}, {type: 'arcade', name: 'Stoneman Arcade'}, {type: 'street', name: 'Saxon Street'}, {type: 'cops', name: 'Yelchin Police Department'}],
                [{type: 'storage', name: 'Altuca Bank'}, {type: 'street', name: 'Barker Avenue'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'work', name: 'A Worksite'}, {type: 'mansion', name: 'Hell House'}, {type: 'parkbottomleft', name: 'Murphy Park'}, {type: 'parkbottomright', name: 'Murphy Park'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'street', name: 'Winfield Road'}, {type: 'street', name: 'Warner Street'}],
                [{type: 'store', name: "Vail's Magic Shop"}, {type: 'powersub', name: 'Fairview Hights Relay Station'}, {type: 'food', name: 'Spice Buds Indian Cuisine'}, {type: 'food', name: 'Three Brothers Pizza'}, {type: 'club', name: 'The Rootin Tootin Bar'}, {type: 'garage', name: 'TireCenter Repairs'}, {type: 'suicide', name: 'GCTV building'}, {type: 'clothes', name: 'Face\'s Masks and Costumes'}, {type: 'suicide', name: 'Pullman Building'}, {type: 'clothes', name: "Diane's Dancewear"}],
                [{type: 'street', name: 'Lenzi Street'}, {type: 'suicide', name: 'Alfredson Building'}, {type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'store', name: 'Golden Eagle Comics'}, {type: 'factory', name: 'A Warehouse'}, {type: 'gas', name: 'Tirecenter Gas Station'}, {type: 'super', name: 'Low End Grocers'}, {type: 'super', name: 'Low End Grocers'}, {type: 'waste', name: 'A Wasteland'}, {type: 'factory', name: 'A Factory'}],
            ];
                case 'Rockwell':
            return [
                [{type: 'street', name: 'Dowdle Road'}, {type: 'work', name: 'A Worksite'}, {type: 'street', name: 'Cunningham Road'}, {type: 'bar', name: 'Neo Hokkaido'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'museum', name: 'Shaw Library'}, {type: 'store', name: 'Aja High'}, {type: 'store', name: 'Aja High'}, {type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'cops', name: 'Lovelock Police Department'}],
                [{type: 'factory', name: "Sam's Junk Collection"}, {type: 'waste', name: 'A Wasteland'}, {type: 'store', name: "Ruth's Gadget Store"}, {type: 'cemetery', name: 'Illagoth Cemetery'}, {type: 'museum', name: 'Palmer Library'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'street', name: 'Peele Street'}, {type: 'suicide', name: 'Henshall Building'}, {type: 'street', name: 'Wagner Street'}],
                [{type: 'street', name: 'Brimley Street'}, {type: 'store', name: 'Lioneye Records'}, {type: 'street', name: 'Roth Street'}, {type: 'museum', name: 'Grime City Space Museum'}, {type: 'park', name: 'Pucci Park'}, {type: 'park', name: 'Pucci Park'}, {type: 'park', name: 'Pucci Park'}, {type: 'park', name: 'Pucci Park'}, {type: 'street', name: 'Hansen Street'}, {type: 'store', name: 'Aster Automotive'}],
                [{type: 'food', name: '5 Star Steakhouse'}, {type: 'store', name: "Belle's Second Hand Store"}, {type: 'street', name: 'Bradley Lane'}, {type: 'clothes', name: 'Skiffington Jewelry'}, {type: 'park', name: 'Pucci Park'}, {type: 'park', name: 'Pucci Park'}, {type: 'park', name: 'Pucci Park'}, {type: 'park', name: 'Pucci Park'}, {type: 'store', name: 'Vegan Delights Bakery'}, {type: 'museum', name: 'Grime City General Museum'}],
                [{type: 'factory', name: 'A Warehouse'}, {type: 'laz', name: 'Helix Building', link: 'Helix Building (Rockwell)'}, {type: 'food', name: 'Hanh Pho'}, {type: 'street', name: 'Crash Road'}, {type: 'food', name: 'Takehito Ramen'}, {type: 'chicken', name: "Arlena's Chicken"}, {type: 'work', name: 'A Worksite'}, {type: 'store', name: 'Perkins Hotel'}, {type: 'god', name: 'Mosque'}, {type: 'street', name: 'Byrne Street'}],
                [{type: 'store', name: 'Begsby Post Office'}, {type: 'factory', name: 'A Factory'}, {type: 'street', name: 'Begsby Lane'}, {type: 'store', name: 'Marshall Funeral Home'}, {type: 'street', name: 'Lustig Street'}, {type: 'super', name: 'Lablaw Grocery'}, {type: 'super', name: 'Lablaw Grocery'}, {type: 'work', name: 'A Worksite'}, {type: 'store', name: "Gilad's Hardware Store"}, {type: 'waste', name: 'A dump'}],
                [{type: 'street', name: 'Comanche Street'}, {type: 'store', name: 'Nerd Supernova Collectables'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'street', name: 'Kentis Street'}, {type: 'work', name: 'A Worksite'}, {type: 'theatre', name: 'Craven Theatre'}, {type: 'burg', name: 'Goop Beast Burgers'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'storage', name: 'Giotto Bank and Lending'}, {type: 'store', name: 'Lockhart Salon'}],
                [{type: 'clothes', name: "Randi Frescamilla's Beachwear"}, {type: 'hospital', name: 'Lychwood Smith Hospital'}, {type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'bar', name: "Hell Rider's Bar"}, {type: 'parking', name: 'A Parking Lot'}, {type: 'fire', name: 'Cregger Fire Department'}, {type: 'mall', name: 'Rockwell Mall'}, {type: 'mall', name: 'Rockwell Mall'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'clothes', name: "Toni's Dancewear"}],
                [{type: 'street', name: 'Tiger Shark Street'}, {type: 'secret', name: 'Very Abnormal Street'}, {type: 'gas', name: 'Rex Gas'}, {type: 'street', name: 'Fincher Avenue'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'mall', name: 'Rockwell Mall'}, {type: 'mall', name: 'Rockwell Mall'}, {type: 'guns', name: "Sleepy's Custom Firearms"}, {type: 'street', name: 'Scrimshaw Street'}],
                [{type: 'work', name: 'A Worksite'}, {type: 'suicide', name: 'Scott Building'}, {type: 'street', name: 'Friedkin Lane'}, {type: 'cops', name: 'Fincher Police Department'}, {type: 'street', name: 'Lynch Street'}, {type: 'street', name: 'Cregger Avenue'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'powersub', name: 'Rockwell Relay Station'}, {type: 'apothecary', name: "Rosello's Pharmacy"}]
            ];
        case 'Mulston':
                return [
                    [{type: 'street', name: 'Crooked Road'}, {type: 'work', name: 'Work Site'}, {type: 'street', name: 'Willowshock Avenue'}, {type: 'store', name: 'Mulston Funeral Home'}, {type: 'waste', name: 'Dump'}, {type: 'street', name: 'Danger Street'}, {type: 'street', name: 'Danger Street'}, {type: 'park', name: 'Mulston Park'}, {type: 'park', name: 'Mulston Park'}, {type: 'work', name: 'Work Site'}],
                    [{type: 'cemetery', name: 'Barhah Cemetery'}, {type: 'gas', name: 'Pit Stop Pros'}, {type: 'hospital', name: 'Mulston Hospital'}, {type: 'parking', name: 'Parking Lot'}, {type: 'food', name: 'The Secret Stash'}, {type: 'home', name: 'Skyline Lofts'}, {type: 'home', name: 'The Vantage'}, {type: 'park', name: 'Mulston Park'}, {type: 'park', name: 'Mulston Park'}, {type: 'museum', name: 'Grime City Train Museum'}],
                    [{type: 'store', name: 'Just 1$'}, {type: 'street', name: 'Willowshade Avenue'}, {type: 'food', name: 'Spuds Fish & Chips'}, {type: 'street', name: 'Cedarbrush Street'}, {type: 'factory', name: 'Factory'}, {type: 'factory', name: 'Factory'}, {type: 'parking', name: 'Parking Lot'}, {type: 'waste', name: 'Dump'}, {type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'store', name: 'Caiger Tools'}],
                    [{type: 'museum', name: 'Mulston Library'}, {type: 'store', name: 'Mulston Blood Drive'}, {type: 'laz', name: 'Helix Building', link: 'Helix Building (Mulston)'}, {type: 'subway', name: 'Mulston Subway'}, {type: 'factory', name: 'Factory'}, {type: 'waste', name: 'Waste Treatment Plant'}, {type: 'waste', name: 'Waste Treatment Plant'}, {type: 'work', name: 'Work Site'}, {type: 'store', name: 'Music Shop'}, {type: 'street', name: 'Sarossy Street'}],
                    [{type: 'work', name: 'Work site'}, {type: 'work', name: 'Work site'}, {type: 'store', name: 'Break and Fix'}, {type: 'work', name: 'Work Site'}, {type: 'factory', name: 'Factory'}, {type: 'waste', name: 'Waste Treatment Plant'}, {type: 'waste', name: 'Waste Treatment Plant'}, {type: 'street', name: 'Cedar Acres Drive'}, {type: 'super', name: 'Hoban Supermarket'}, {type: 'super', name: 'Hoban Supermarket'}],
                    [{type: 'factory', name: 'Factory'}, {type: 'suicide', name: 'Leviathan Building'}, {type: 'god', name: 'Grand Temple of Bhaal'}, {type: 'street', name: 'Maple Glade Lane'}, {type: 'apothecary', name: "Rosello's Pharmacy"}, {type: 'factory', name: 'Factory'}, {type: 'factory', name: 'Factory'}, {type: 'parking', name: 'Parking Lot'}, {type: 'storage', name: 'Riverstone Bank'}, {type: 'store', name: 'SW Magic'}],
                    [{type: 'work', name: 'Work site'}, {type: 'parking', name: 'Parking Lot'}, {type: 'waste', name: 'Junkyard'}, {type: 'home', name: 'Ashford Court'}, {type: 'suicide', name: 'Prism Tower'}, {type: 'arcade', name: '8-bit Blitz'}, {type: 'powersub', name: 'Mulston Power Relay'}, {type: 'cops', name: 'Mulston PD'}, {type: 'store', name: "Pop's Video Rental"}, {type: 'bar', name: 'The Burchell'}],
                    [{type: 'suicide', name: 'Veil Tower'}, {type: 'butcher', name: "Barney's Butcher"}, {type: 'street', name: "Smelter's End Way"}, {type: 'parking', name: 'Parking Lot'}, {type: 'work', name: 'Work Site'}, {type: 'club', name: "Kevan's Bowling"}, {type: 'burg', name: 'Beef & Bun'}, {type: 'fire', name: 'Mulston FD'}, {type: 'street', name: 'Ironhook Boulevard'}, {type: 'street', name: 'Angus Road'}],
                    [{type: 'street', name: 'Mulston Avenue'}, {type: 'store', name: 'Furry Friends Supply'}, {type: 'waste', name: 'Dump'}, {type: 'storage', name: 'Union Storage'}, {type: 'storage', name: 'Union Storage'}, {type: 'street', name: 'Russ Street'}, {type: 'parking', name: 'Parking Lot'}, {type: 'home', name: 'Marlowe Residences'}, {type: 'home', name: 'Whiteknoll Apartments'}, {type: 'donut', name: "Dale's Donuts"}],
                    [{type: 'home', name: 'House'}, {type: 'home', name: 'Oak Hill Flats'}, {type: 'street', name: 'Spine Street'}, {type: 'storage', name: 'Union Storage'}, {type: 'storage', name: 'Union Storage'}, {type: 'parking', name: 'Parking Lot'}, {type: 'food', name: 'Timber & Flame'}, {type: 'street', name: 'Concrete Way'}, {type: 'food', name: 'The Jade Blossom'}, {type: 'home', name: 'Mulston Heights'}]
                ];
             case 'Glimmer Fields':
                return [
                    [{type: 'park', name: 'Ninaber Park'}, {type: 'park', name: 'Ninaber Park'}, {type: 'store', name: "Only 1 $ Store"}, {type: 'factory', name: 'Factory'}, {type: 'store', name: 'Sorenson Pet Shop'}, {type: 'work', name: 'Worksite'}, {type: 'clothes', name: "Geoffreys Jewelry"}, {type: 'waste', name: "Greg's Junk"}, {type: 'waste', name: 'Wasteland'}, {type: 'store', name: 'McLoughlin Car Repair'}],
                    [{type: 'super', name: 'Blue Supermarket'}, {type: 'super', name: 'Blue Supermarket'}, {type: 'food', name: 'Delicacy Bakery'}, {type: 'street', name: 'Gallichotte Street'}, {type: 'suicide', name: 'Hendrie Building'}, {type: 'store', name: 'Fielding Hardware'}, {type: 'street', name: 'Bearse Street'}, {type: 'club', name: "Nadja's Club"}, {type: 'store', name: 'Sinister Candles'}, {type: 'street', name: 'Tilly Street'}],
                    [{type: 'parking', name: 'Parking Lot'}, {type: 'street', name: 'Myre Street'}, {type: 'street', name: 'MacCulloch Street'}, {type: 'street', name: 'Shippee Street'}, {type: 'clothes', name: "Derek's T-Shirts"}, {type: 'street', name: 'Stern Boulevard'}, {type: 'laz', name: 'Helix Building', link: 'Helix Building (Glimmer Fields)'}, {type: 'subway', name: 'Glimmer Fields Subway'}, {type: 'street', name: 'Gin Street'}, {type: 'store', name: "Summers Outdoors Shop"}],
                    [{type: 'work', name: 'Worksite'}, {type: 'clothes', name: "Crosses Costume's"}, {type: 'parking', name: 'Used Car Lot'}, {type: 'arcade', name: 'The Dark Game Center'}, {type: 'parking', name: 'Parking Lot'}, {type: 'parking', name: 'Parking Lot'}, {type: 'parking', name: 'Parking Lot'}, {type: 'street', name: 'Lonely Street'}, {type: 'fire', name: 'Glimmer Fields FD'}, {type: 'apothecary', name: "Rosello's Pharmacy"}],
                    [{type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'suicide', name: 'Kandarin Building'}, {type: 'gas', name: 'Redbourn Station'}, {type: 'chicken', name: "Flo's -Fried Chicken"}, {type: 'zoo', name: 'Zoo Crocodile Pen'}, {type: 'zoo', name: 'Zoo Gorilla Pen'}, {type: 'zoo', name: 'Zoo Tiger Pen'}, {type: 'food', name: "Wang's Noodles"}, {type: 'storage', name: "Big Al's Big Storage"}, {type: 'work', name: 'Worksite'}],
                    [{type: 'street', name: 'WK Road'}, {type: 'suicide', name: 'The Repth Hotel'}, {type: 'street', name: 'Reitz Street'}, {type: 'suicide', name: 'Fabus Building'}, {type: 'zoo', name: 'Zoo Bear Pen'}, {type: 'zoo', name: 'Zoo Concessions'}, {type: 'zoo', name: 'Zoo Bird Sanctuary'}, {type: 'home', name: 'Jameson Mansion'}, {type: 'home', name: 'Frost Mansion'}, {type: 'parking', name: 'Parking Lot'}],
                    [{type: 'parking', name: 'Parking Lot'}, {type: 'parking', name: 'Parking Lot'}, {type: 'cops', name: 'Reitz PD'}, {type: 'work', name: 'Worksite'}, {type: 'zoo', name: 'Zoo Gift Shop'}, {type: 'zoo', name: 'Zoo Wolf Pen'}, {type: 'zoo', name: 'Zoo Aquarium'}, {type: 'cemetery', name: 'Chiodo Cemetery'}, {type: 'parking', name: 'Parking Lot'}, {type: 'hospital', name: 'Glimmer Fields Blood Bank'}],
                    [{type: 'street', name: 'Turner Road'}, {type: 'waste', name: 'Wasteland'}, {type: 'gas', name: 'Foxtrot Gas'}, {type: 'store', name: "Feris the Magnificent's Magic"}, {type: 'parking', name: 'Parking Lot'}, {type: 'parking', name: 'Parking Lot'}, {type: 'parking', name: 'Parking Lot'}, {type: 'storage', name: 'Massari Bank'}, {type: 'park', name: 'Fonda Park'}, {type: 'cornerstore', name: 'Dwyer Provider'}],
                    [{type: 'work', name: 'Worksite'}, {type: 'museum', name: 'Museum of Japanese Warfare'}, {type: 'cemetery', name: 'R. Corman Cemetery'}, {type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'store', name: 'Keligian Sports'}, {type: 'museum', name: 'Stratton Library'}, {type: 'work', name: 'Worksite'}, {type: 'suicide', name: 'Saradon Building'}, {type: 'game', name: 'Hyperion Tabletop Gaming'}, {type: 'bar', name: 'The Lonely Bar'}],
                    [{type: 'suicide', name: 'Leviathan Security Building'}, {type: 'work', name: 'Worksite'}, {type: 'super', name: 'Halloween SuperStore'}, {type: 'street', name: 'Engel Street'}, {type: 'store', name: 'Albini Music'}, {type: 'powersub', name: 'Glimmer Fields Power Relay'}, {type: 'store', name: 'Stark Comics'}, {type: 'street', name: 'Ragsdale Street'}, {type: 'game', name: 'Pixel Palace'}, {type: 'street', name: 'Davidtz Street'}]
                 ];
            default:
                return null; // Return null if suburb not found
        }
    }
       
            

        // Function to get color by type
    function getColorByType(type) {
        switch (type) {
            case 'arcade': return '#a305b6';
            case 'detective': return '#B0B0B0';
            case 'secret': return '#403e3e';
            case 'guns': return '#3f57d0';
            case 'laz': return '#cb00ff';
            case 'cops': return '#3f57d0';
            case 'suicide': return '#8B4513';
            case 'mall': return '#56cea6';
            case 'factory': return '#B0B0B0';
            case 'super': return '#70FC97';
            case 'cemetery': return '#B0B0B0';
            case 'street': return '#B0B0B0';
            case 'store': return '#B0B0B0';
            case 'parking': return '#B0B0B0';
            case 'god': return '#FFFFFF';
            case 'fire': return '#B0B0B0';
            case 'park': return '#00ff19';
            case 'hospital': return '#FFB6C1';
            case 'theatre': return '#B0B0B0';
            case 'food': return '#B0B0B0';
            case 'gym': return '#B0B0B0';
            case 'laundry': return '#B0B0B0';
            case 'waste': return '#B0B0B0';
            case 'clothes': return '#FA6B36';
            case 'zoo': return '#89f998';
            case 'work': return '#B0B0B0';
            case 'tarot': return '#B0B0B0';
            case 'home': return '#FF4500';
            case 'donut': return '#B0B0B0';
            case 'bar': return '#B0B0B0';
            case 'gas': return '#FFA500';
            case 'powersub': return '#FFFF00';
            case 'butcher': return '#B0B0B0';
            case 'hole': return ' #403e3e';
            case 'chicken': return '#B0B0B0';
            case 'burg': return '#B0B0B0';
            case 'museum': return '#B0B0B0';
            case 'cornerstore': return '#B0B0B0';
            case 'car': return '#B0B0B0';
            case 'sushi': return '#B0B0B0';
            case 'apothecary': return '#B0B0B0';
            case 'storage': return '#DAA520';
            case 'transport': return '#000000';
            default: return '#FFFFFF';
        }
    }


    // Adding custom CSS for the map container and cells
    const style = document.createElement('style');
    style.textContent = `
        #custom-map-container {
            background-color: white;
            border: 1px solid black;
            z-index: 9999;
            overflow: hidden;
            cursor: pointer;
        }

        #custom-map-grid {
            width: 100%;
            height: 100%;
            border-collapse: collapse;
            pointer-events: auto;
        }

        .custom-map-cell {
            border: 1px solid #777; /* Changed to a slightly lighter border for non-player cells */
            width: 10%;
            height: 10%;
            font-size: 9px;
            text-align: center;
            vertical-align: middle;
        }
    `;
    document.head.appendChild(style);
})();
