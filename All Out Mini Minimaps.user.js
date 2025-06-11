// ==UserScript==
// @name         All Out Mini Minimaps
// @namespace    http://tampermonkey.net/
// @version      12
// @description  A horrible minimap, ugly yet effective and smaller. Now with player position!
// @author       Someone Who Isnt Me (with modifications from larnak and Gemini)
// @match        https://www.allouthell.com/game.php
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
    // NEW: Function to extract the player's current location name from the "div.room" element
    function getCurrentLocationName() {
        // Find the div with the class "room"
        const locationElement = document.querySelector('div.room');

        if (locationElement) {
            const fullText = locationElement.textContent; // e.g., "You are currently at Lynch Street. (514, 519)"

            // Use a regular expression to extract the text between "at ", "inside ", or "outside " and the following period "."
            const match = fullText.match(/(?:at|inside|outside)\s(.*?)\./);

            // If a match is found, match[1] will contain the captured group (the location name)
            if (match && match[1]) {
                return match[1].trim(); // Returns "Lynch Street"
            }
        }
        // If the element or the pattern is not found, return null
        return null;
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
    let playerLocationName = getCurrentLocationName(); // Get player's location
    let mapData = getMapDataForSuburb(currentSuburb);

    if (!mapData) {
        console.error('Map data not found for suburb:', currentSuburb);
        // Display a message in the map container
        mapContainer.textContent = `Map data for "${currentSuburb}" not found.`;
        mapContainer.style.color = 'red';
        mapContainer.style.textAlign = 'center';
        mapContainer.style.padding = '20px';
        return;
    }

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

            // Check if the current cell's name matches the player's location
            if (playerLocationName && cell.name === playerLocationName) {
                // This is the player's current location, give it a special color
                td.style.backgroundColor = '#FF00FF'; // Bright pink/magenta
                td.style.border = '2px solid #000000'; // Extra border to make it pop
            } else {
                // Otherwise, use the standard color for the building type
                td.style.backgroundColor = getColorByType(cell.type);
            }

            td.title = cell.name; // This line sets the tooltip text to display on mouseover
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

    // Function to get map data based on suburb
    function getMapDataForSuburb(suburb) {
        // Define map data for each suburb here
        switch (suburb) {
             case 'Mulston':
                return [
                    [{type: 'street', name: 'Crooked Road'}, {type: 'work', name: 'Work Site'}, {type: 'street', name: 'Willowshock Avenue'}, {type: 'store', name: 'Mulston Funeral Home'}, {type: 'waste', name: 'Dump'}, {type: 'street', name: 'Danger Street'}, {type: 'street', name: 'Danger Street'}, {type: 'park', name: 'Mulston Park'}, {type: 'park', name: 'Mulston Park'}, {type: 'work', name: 'Work Site'}],
                    [{type: 'cemetery', name: 'Barhah Cemetery'}, {type: 'gas', name: 'Pit Stop Pros'}, {type: 'hospital', name: 'Mulston Hospital'}, {type: 'parking', name: 'Parking Lot'}, {type: 'food', name: 'The Secret Stash'}, {type: 'flat', name: 'Skyline Lofts'}, {type: 'flat', name: 'The Vantage'}, {type: 'park', name: 'Mulston Park'}, {type: 'park', name: 'Mulston Park'}, {type: 'museum', name: 'Grime City Train Museum'}],
                    [{type: 'store', name: 'Just 1$'}, {type: 'street', name: 'Willowshade Avenue'}, {type: 'food', name: 'Spuds Fish & Chips'}, {type: 'street', name: 'Cedarbrush Street'}, {type: 'factory', name: 'Factory'}, {type: 'factory', name: 'Factory'}, {type: 'parking', name: 'Parking Lot'}, {type: 'waste', name: 'Dump'}, {type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'store', name: 'Caiger Tools'}],
                    [{type: 'museum', name: 'Mulston Library'}, {type: 'store', name: 'Mulston Blood Drive'}, {type: 'laz', name: 'Helix Building', link: 'Helix Building (Mulston)'}, {type: 'subway', name: 'Mulston Subway'}, {type: 'factory', name: 'Factory'}, {type: 'waste', name: 'Waste Treatment Plant'}, {type: 'waste', name: 'Waste Treatment Plant'}, {type: 'work', name: 'Work Site'}, {type: 'store', name: 'Music Shop'}, {type: 'street', name: 'Sarossy Street'}],
                    [{type: 'work', name: 'Work site'}, {type: 'work', name: 'Work site'}, {type: 'store', name: 'Break and Fix'}, {type: 'work', name: 'Work Site'}, {type: 'factory', name: 'Factory'}, {type: 'waste', name: 'Waste Treatment Plant'}, {type: 'waste', name: 'Waste Treatment Plant'}, {type: 'street', name: 'Cedar Acres Drive'}, {type: 'super', name: 'Hoban Supermarket'}, {type: 'super', name: 'Hoban Supermarket'}],
                    [{type: 'factory', name: 'Factory'}, {type: 'suicide', name: 'Leviathan Building'}, {type: 'god', name: 'Grand Temple of Bhaal'}, {type: 'street', name: 'Maple Glade Lane'}, {type: 'hospital', name: "Rosello's Pharmacy"}, {type: 'factory', name: 'Factory'}, {type: 'factory', name: 'Factory'}, {type: 'parking', name: 'Parking Lot'}, {type: 'bank', name: 'Riverstone Bank'}, {type: 'store', name: 'SW Magic'}],
                    [{type: 'work', name: 'Work site'}, {type: 'parking', name: 'Parking Lot'}, {type: 'waste', name: 'Junkyard'}, {type: 'flat', name: 'Ashford Court'}, {type: 'suicide', name: 'Prism Tower'}, {type: 'game', name: '8-it Blitz'}, {type: 'powersub', name: 'Mulston Power Relay'}, {type: 'cops', name: 'Mulston PD'}, {type: 'store', name: "Pop's Video Rental"}, {type: 'bar', name: 'The Burchell'}],
                    [{type: 'suicide', name: 'Veil Tower'}, {type: 'butcher', name: "Barney's Butcher"}, {type: 'street', name: "Smelter's End Way"}, {type: 'parking', name: 'Parking Lot'}, {type: 'work', name: 'Work Site'}, {type: 'club', name: "Kevan's Bowling"}, {type: 'burg', name: 'Beef & Bun'}, {type: 'fire', name: 'Mulston FD'}, {type: 'street', name: 'Ironhook Boulevard'}, {type: 'street', 'name': 'Angus Road'}],
                    [{type: 'street', name: 'Mulston Avenue'}, {type: 'store', name: 'Furry Friends Supply'}, {type: 'waste', name: 'Dump'}, {type: 'storage', name: 'Union Storage'}, {type: 'Storage', name: 'Union Storage'}, {type: 'street', name: 'Russ Street'}, {type: 'parking', name: 'Parking Lot'}, {type: 'home', name: 'Marlowe Residences'}, {type: 'home', name: 'Whiteknoll Apartments'}, {type: 'donut', name: "Dale's Donuts"}],
                    [{type: 'home', name: 'House'}, {type: 'home', name: 'Oak Hill Flats'}, {type: 'street', name: 'Spine Street'}, {type: 'storage', name: 'Union Storage'}, {type: 'storage', name: 'Union Storage'}, {type: 'parking', name: 'Parking Lot'}, {type: 'food', name: 'Timber & Flame'}, {type: 'street', name: 'Concrete Way'}, {type: 'food', name: 'The Jade Blossom'}, {type: 'home', name: 'Mulston Heights'}]
                ];
             case 'Glimmer Fields':
                return [
                    [{type: 'park', name: 'Ninaber Park'}, {type: 'park', name: 'Ninaber Park'}, {type: 'store', name: "Only 1 $ Store"}, {type: 'factory', name: 'Factory'}, {type: 'store', name: 'Sorenson Pet Shop'}, {type: 'work', name: 'Worksite'}, {type: 'clothes', name: "Geoffreys Jewelry"}, {type: 'waste', name: "Greg's Junk"}, {type: 'waste', name: 'Wasteland'}, {type: 'store', name: 'McLoughlin Car Repair'}],
                    [{type: 'super', name: 'Blue Supermarket'}, {type: 'super', name: 'Blue Supermarket'}, {type: 'food', name: 'Delicacy Bakery'}, {type: 'street', name: 'Gallichotte Street'}, {type: 'suicide', name: 'Hendrie Building'}, {type: 'store', name: 'Fielding Hardware'}, {type: 'street', name: 'Bearse Street'}, {type: 'club', name: "Nadja's Club"}, {type: 'store', name: 'Sinister Candles'}, {type: 'street', name: 'Tilly Street'}],
                    [{type: 'parking', name: 'Parking Lot'}, {type: 'street', name: 'Myre Street'}, {type: 'street', name: 'MacCulloch Street'}, {type: 'street', name: 'Shippee Street'}, {type: 'clothes', name: "Derek's T-Shirts"}, {type: 'street', name: 'Stern Boulevard'}, {type: 'laz', name: 'Helix Building', link: 'Helix Building (Glimmer Fields)'}, {type: 'subway', name: 'Glimmer Fields Subway'}, {type: 'street', name: 'Gin Street'}, {type: 'store', name: "Summers Outdoors Shop"}],
                    [{type: 'work', name: 'Worksite'}, {type: 'clothes', name: "Crosses Costume's"}, {type: 'parking', name: 'Used Car Lot'}, {type: 'club', name: 'The Dark Game Center'}, {type: 'parking', name: 'Parking Lot'}, {type: 'parking', name: 'Parking Lot'}, {type: 'parking', name: 'Parking Lot'}, {type: 'street', name: 'Lonely Street'}, {type: 'fire', name: 'Glimmer Fields FD'}, {type: 'store', name: "Rosello's Pharmacy"}],
                    [{type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'suicide', name: 'Kandarin Building'}, {type: 'gas', name: 'Redbourn Station'}, {type: 'chicken', name: "Flo's -Fried Chicken"}, {type: 'zoo', name: 'Zoo Crocodile Pen'}, {type: 'zoo', name: 'Zoo Gorilla Pen'}, {type: 'zoo', name: 'Zoo Tiger Pen'}, {type: 'food', name: "Wang's Noodles"}, {type: 'storage', name: "Big Al's Big Storage"}, {type: 'work', name: 'Worksite'}],
                    [{type: 'street', name: 'WK Road'}, {type: 'suicide', name: 'The Repth Hotel'}, {type: 'street', name: 'Reitz Street'}, {type: 'suicide', name: 'Fabus Building'}, {type: 'zoo', name: 'Zoo Bear Pen'}, {type: 'zoo', name: 'Zoo Concessions'}, {type: 'zoo', name: 'Zoo Bird Sanctuary'}, {type: 'home', name: 'Jameson Mansion'}, {type: 'home', name: 'Frost Mansion'}, {type: 'parking', name: 'Parking Lot'}],
                    [{type: 'parking', name: 'Parking Lot'}, {type: 'parking', name: 'Parking Lot'}, {type: 'cops', name: 'Reitz PD'}, {type: 'work', name: 'Worksite'}, {type: 'zoo', name: 'Zoo Gift Shop'}, {type: 'zoo', name: 'Zoo Wolf Pen'}, {type: 'zoo', name: 'Zoo Aquarium'}, {type: 'cemetery', name: 'Chiodo Cemetery'}, {type: 'parking', name: 'Parking Lot'}, {type: 'hospital', name: 'Glimmer Fields Blood Bank'}],
                    [{type: 'street', name: 'Turner Road'}, {type: 'waste', name: 'Wasteland'}, {type: 'gas', name: 'Foxtrot Gas'}, {type: 'store', name: "Feris the Magnificent's Magic"}, {type: 'parking', name: 'Parking Lot'}, {type: 'parking', name: 'Parking Lot'}, {type: 'parking', name: 'Parking Lot'}, {type: 'bank', name: 'Massari Bank'}, {type: 'park', name: 'Fonda Park'}, {type: 'cornerstore', name: 'Dwyer Provider'}],
                    [{type: 'work', name: 'Worksite'}, {type: 'museum', name: 'Museum of Japanese Warfare'}, {type: 'cemetery', name: 'R. Corman Cemetery'}, {type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'store', name: 'Keligian Sports'}, {type: 'museum', name: 'Stratton Library'}, {type: 'work', name: 'Worksite'}, {type: 'suicide', name: 'Saradon Building'}, {type: 'game', name: 'Hyperion Tabletop Gaming'}, {type: 'bar', name: 'The Lonely Bar'}],
                    [{type: 'suicide', name: 'Leviathan Security Building'}, {type: 'work', name: 'Worksite'}, {type: 'super', name: 'Halloween SuperStore'}, {type: 'street', name: 'Engel Street'}, {type: 'store', name: 'Albini Music'}, {type: 'powersub', name: 'Glimmer Fields Power Relay'}, {type: 'store', name: 'Stark Comics'}, {type: 'street', name: 'Ragsdale Street'}, {type: 'game', name: 'Pixel Palace'}, {type: 'street', name: 'Davidtz Street'}]
                 ];
            case 'Roja':
                return [
                    [{type: 'cemetery', name: 'Dyer Cemetery'}, {type: 'cemetery', name: 'Dyer Cemetery'}, {type: 'street', name: 'That Street'}, {type: 'store', name: "Jason's Sports Wares"}, {type: 'store', name: 'Last Breath Funeral'}, {type: 'parking', name: 'Parking Lot'}, {type: 'store', name: "Dr. Jame's Practice"}, {type: 'god', name: 'Cult of Hiei'}, {type: 'parking', name: 'Parking Lot'}, {type: 'fire', name: 'Grime City Fire Department'}],
                    [{type: 'park', name: 'Goblin Park'}, {type: 'hospital', name: 'Goblin General'}, {type: 'parking', name: 'Parking Lot'}, {type: 'park', name: 'A Lonely Hill'}, {type: 'street', name: 'Left Street'}, {type: 'theatre', name: 'It Froze Theatre'}, {type: 'street', name: 'Street Street'}, {type: 'park', name: 'Drakaasi Park'}, {type: 'bar', name: 'Drinkwater & Bramble'}, {type: 'street', name: 'River Styx Street'}],
                    [{type: 'parking', name: 'Parking Lot'}, {type: 'street', name: 'Pine Street'}, {type: 'store', name: 'Grohls'}, {type: 'street', name: 'Treat Street'}, {type: 'food', name: 'No Bueno'}, {type: 'parking', name: 'Parking Lot'}, {type: 'gym', name: 'Swole Gym'}, {type: 'street', name: 'Poor Street'}, {type: 'street', name: 'North Red Street'}, {type: 'laundry', name: 'Bubble Laundry'}],
                    [{type: 'store', name: 'Mako Flowers'}, {type: 'street', name: 'Pine Street'}, {type: 'parking', name: 'Parking Lot'}, {type: 'park', name: 'Grass Field'}, {type: 'bank', name: 'Basement Vault'}, {type: 'waste', name: 'Wasteland'}, {type: 'store', name: 'Grime Time Casino'}, {type: 'store', name: 'Grime Time Casino'}, {type: 'parking', name: 'Parking Lot'}, {type: 'store', name: "Peeker's Private Eye"}],
                    [{type: 'waste', name: 'Wasteland'}, {type: 'food', name: "Vendetta's Italian Cuisine"}, {type: 'cops', name: 'Grime City Police'}, {type: 'street', name: 'Purple Street'}, {type: 'store', name: 'Rust Cuts'}, {type: 'work', name: 'Work Site'}, {type: 'parking', name: 'Parking Lot'}, {type: 'tarot', name: 'Scorpio Stellium Tarot'}, {type: 'street', name: 'Red Street'}, {type: 'street', name: 'Blue Ave'}],
                    [{type: 'home', name: 'The Whitechapel House'}, {type: 'street', name: 'Done Street'}, {type: 'donut', name: 'Sundown Donut'}, {type: 'waste', name: 'Wasteland'}, {type: 'park', name: 'Soil Park'}, {type: 'street', name: 'Dirt Boulevard'}, {type: 'bar', name: 'Zero Below'}, {type: 'store', name: 'Seven Sins'}, {type: 'street', name: 'Red Street'}, {type: 'store', name: "Koma's Kosplay"}],
                    [{type: 'street', name: 'Above Street'}, {type: 'gas', name: "Hell'vron"}, {type: 'powersub', name: 'Roja Relay Station'}, {type: 'bar', name: 'Club Lumina'}, {type: 'store', name: "Leymur's"}, {type: 'store', name: 'Doggy Style Pet Grooming'}, {type: 'cemetery', name: 'Pet Sematary'}, {type: 'parking', name: 'Parking Lot'}, {type: 'street', name: 'Red Street'}, {type: 'waste', name: 'Wasteland'}],
                    [{type: 'butcher', name: "Kreuger's Butcher Shop"}, {type: 'street', name: 'Between Street'}, {type: 'store', name: 'RNG Jewelry'}, {type: 'street', name: 'Grove Street'}, {type: 'store', name: "Spin T' Win"}, {type: 'hole', name: 'A Strange Hole'}, {type: 'store', name: 'Nerve Ending Dentistry'}, {type: 'chicken', name: "Chick De' Cay"}, {type: 'street', name: 'Red Street'}, {type: 'waste', name: 'Wasteland'}],
                    [{type: 'burg', name: 'The Albatross Inn'}, {type: 'gas', name: 'The Pit Stop'}, {type: 'street', name: 'Up Street'}, {type: 'store', name: 'Sickling Strook'}, {type: 'tarot', name: 'Venus Veritas'}, {type: 'store', name: 'Bates & Lasten Law'}, {type: 'street', name: 'Red Street'}, {type: 'street', name: 'Green Street'}, {type: 'store', name: "Noor's Greenhouse"}, {type: 'street', name: 'Down Street'}],
                    [{type: 'street', name: 'Blue Street'}, {type: 'store', name: 'Bells'}, {type: 'museum', name: 'Devon Park Museum'}, {type: 'store', name: 'Dr. Hargreave'}, {type: 'store', name: 'Geeky Beaky Comics'}, {type: 'bank', name: 'Hijax Bank'}, {type: 'street', name: 'Red Street'}, {type: 'store', name: 'Jilly Beans'}, {type: 'street', name: 'Purple Street'}, {type: 'store', name: 'Makoto & Natai Tofu'}],
                    [{type: 'tarot', name: 'Trixter Micks Tarot'}, {type: 'car', name: 'MyCar Car Repair'}, {type: 'cornerstore', name: 'Local Mini Mart'}, {type: 'car', name: 'Inferno Auto'}, {type: 'tarot', name: 'Courtney Lane Tarot'}, {type: 'store', name: 'Ashley T. Redfern Law'}, {type: 'street', name: 'Red Street'}, {type: 'store', name: 'Fabrics R Us'}, {type: 'street', name: 'Branley Boulevard'}, {type: 'store', name: 'Red & Flint'}],
                    [{type: 'store', name: 'Will You Gou'}, {type: 'store', name: 'Fliq & Pint'}, {type: 'theatre', name: 'Swine & Spirits'}, {type: 'store', name: 'Tickler Tool'}, {type: 'store', name: 'Scenic Urban Plans'}, {type: 'parking', name: 'Parking Lot'}, {type: 'park', name: 'A Lonely Hill'}, {type: 'store', name: 'The Oozing Blade'}, {type: 'park', name: 'Goblin Park'}, {type: 'street', name: 'Bloody Street'}],
                    [{type: 'donut', name: 'Joja’ Donuts'}, {type: 'store', name: 'The Grimey Pickle'}, {type: 'food', name: 'Paella Pantry'}, {type: 'food', name: "David's Seafood"}, {type: 'store', name: 'Mystical Incense'}, {type: 'store', name: 'Timelock Translations'}, {type: 'tarot', name: 'Silent Suzy’s Tarot'}, {type: 'store', name: 'Red Street'}, {type: 'store', name: 'Mega Mad Mercs'}, {type: 'store', name: 'Mephisto & Co.'}]
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
                    [{type: 'cornerstore', name: 'Dwyer'}, {type: 'powersub', name: 'Elgin Relay Station'}, {type: 'store', name: "Lee's Hardware"}, {type: 'suicide', name: 'Cochrane Building'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'bank', name: 'Stacey Bank'}, {type: 'work', name: 'A Worksite'}, {type: 'mall', name: 'Englund Mall'}, {type: 'mall', name: 'Englund Mall'}, {type: 'store', name: 'Argento Theatre'}],
                    [{type: 'school', name: 'Robert Wise High'}, {type: 'school', name: 'Robert Wise High'}, {type: 'factory', name: 'A Factory'}, {type: 'gun', name: "Johnny's Guns and Americana"}, {type: 'street', name: 'Vuris Street'}, {type: 'gas', name: "Will's Gas Station"}, {type: 'store', name: "Big Vitor's Electronics"}, {type: 'mall', name: 'Englund Mall'}, {type: 'mall', name: 'Englund Mall'}, {type: 'street', name: 'Priin Street'}]
                ];
            case 'Beachwood':
                return [
                    [{type: 'store', name: 'Hairy Eyeball Detective Agency'}, {type: 'street', name: 'Mean Street'}, {type: 'suicide', name: 'Brunet Building'}, {type: 'street', name: 'Hobson Street'}, {type: 'factory', name: 'A Warehouse'}, {type: 'store', name: 'Leviathan Security'}, {type: 'waste', name: 'A Wasteland'}, {type: 'street', name: 'Scrimm Street'}, {type: 'suicide', name: 'Coscarelli Building'}, {type: 'street', name: 'Tyr Avenue'}],
                    [{type: 'park', name: 'Brunet Park'}, {type: 'bank', name: 'Virtue Bank'}, {type: 'food', name: "Zuccaro's"}, {type: 'cops', name: 'Sondergaard Police Department'}, {type: 'food', name: "Chen's Chinese Buffet"}, {type: 'factory', name: 'A Warehouse'}, {type: 'work', name: 'A Worksite'}, {type: 'store', name: "Jodie's Dancewear"}, {type: 'street', name: 'Sydow Street'}, {type: 'parking', name: 'A Parking Lot'}],
                    [{type: 'factory', name: 'A Factory'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'fire', name: 'Barrymore Fire Department'}, {type: 'factory', name: 'A Factory'}, {type: 'store', name: "Ankers Dentistry"}, {type: 'street', name: 'Moran Lane'}, {type: 'store', name: "Sandweiss Furniture"}, {type: 'store', name: "The Mimery"}, {type: 'store', name: "Final Hits Records"}, {type: 'factory', name: 'A Warehouse'}],
                    [{type: 'factory', name: 'A Factory'}, {type: 'club', name: "Nightrunner Arcade"}, {type: 'street', name: 'Sondergaard Street'}, {type: 'store', name: "EJ Well's Hardware"}, {type: 'street', name: 'Elmdale Street'}, {type: 'food', name: "Manuel's Taco Stand"}, {type: 'store', name: "Savini Funeral Home"}, {type: 'street', name: 'Bannister Street'}, {type: 'gas', name: "Halo Gas"}, {type: 'parking', name: 'A Parking Lot'}],
                    [{type: 'street', name: 'Rathbone Avenue'}, {type: 'street', name: 'Barrymore Avenue'}, {type: 'park', name: 'Tracy Park'}, {type: 'street', name: 'Massey Street'}, {type: 'bar', name: "Bruce Greene's Dive Bar"}, {type: 'street', name: 'Loomis Street'}, {type: 'store', name: "Hypnotist Sinclair's Magic"}, {type: 'morg', name: "Spicy Bones Morgue"}, {type: 'club', name: "Uncle Roly's Bowling"}, {type: 'street', name: 'Warbeck Street'}],
                    [{type: 'museum', name: 'Hegedus Library'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'museum', name: 'Museum Of Science And Nature'}, {type: 'street', name: 'Regency Street'}, {type: 'cemetery', name: 'Wytch Hollow Cemetery'}, {type: 'cemetery', name: 'Wytch Hollow Cemetery'}, {type: 'factory', name: 'Racoon Hill factory'}, {type: 'suicide', name: 'Don Durk Hotel'}, {type: 'museum', name: 'Collas Library'}],
                    [{type: 'store', name: "Weeaboo Market"}, {type: 'street', name: 'Stroheim Street'}, {type: 'suicide', name: 'Bogart Building'}, {type: 'store', name: "Funny Opossum Joke Shop"}, {type: 'parking', name: 'A Parking Lot'}, {type: 'suicide', name: 'Barbeau Building'}, {type: 'powersub', name: 'Beachwood Relay Station'}, {type: 'store', name: "Overtime Sports"}, {type: 'street', name: 'Spinell Street'}, {type: 'food', name: "Badziew Pizza"}],
                    [{type: 'street', name: 'Roundtree Road'}, {type: 'store', name: "Happies Salon"}, {type: 'street', name: 'Edwards Road'}, {type: 'hospital', name: 'Edwards Hospital'}, {type: 'gas', name: "GGoA Petrol"}, {type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'street', name: 'Gordon Lane'}, {type: 'laz', name: 'Helix Building', link: 'Helix Building (Beachwood)'}, {type: 'school1', name: 'Gulager High'}, {type: 'school2', name: 'Gulager High'}],
                    [{type: 'gas', name: "Z'dar Gasoline"}, {type: 'store', name: "Ye Olde Weapons Shop"}, {type: 'bank', name: "Apex Bank"}, {type: 'garage', name: "Good Month Automotive"}, {type: 'street', name: 'Mason Avenue'}, {type: 'super', name: "Super B Groceries"}, {type: 'super', name: "Super B Groceries"}, {type: 'suicide', name: "Wallace Building"}, {type: 'street', name: 'Frost Street'}, {type: 'parking', name: 'A Parking Lot'}],
                    [{type: 'garage', name: "Elite Repairs"}, {type: 'food', name: "Chung's Asian Fusion"}, {type: 'street', name: 'Frye Street'}, {type: 'bar', name: "Kitty Club"}, {type: 'cops', name: "Mason Police Department"}, {type: 'bar', name: "The Fuzz"}, {type: 'parking', name: 'Parking Lot'}, {type: 'store', name: "Fulci Cinema"}, {type: 'hospital', name: "Rosello's Pharmacy"}, {type: 'street', name: 'Lovelock Road'}],
                ];
            case 'Fairview Heights':
                return [
                    [{type: 'cemetery', name: 'Romero Cemetery'}, {type: 'cemetery', name: 'Romero Cemetery'}, {type: 'cemetery', name: 'Romero Cemetery'}, {type: 'cemetery', name: 'Romero Cemetery'}, {type: 'god', name: 'Church'}, {type: 'store', name: 'Stroud Funeral Home'}, {type: 'factory', name: 'A Warehouse'}, {type: 'factory', name: 'A Factory'}, {type: 'food', name: "Remy's Poutine Shop"}, {type: 'factory', name: "Tom's factory Buy And Sell"}],
                    [{type: 'cemetery', name: 'Romero Cemetery'}, {type: 'cemetery', name: 'Romero Cemetery'}, {type: 'cemetery', name: 'Romero Cemetery'}, {type: 'cemetery', name: 'Romero Cemetery'}, {type: 'street', name: 'Howling Moon Avenue'}, {type: 'laz', name: 'Helix Building', link: 'Helix Building (Fairview Heights)'}, {type: 'bar', name: "Reverend Larry's Bar"}, {type: 'cops', name: 'Deodato Police Department'}, {type: 'street', name: 'Deodato Street'}, {type: 'cornerstore', name: 'Dwyer Provider'}],
                    [{type: 'street', name: 'Sutherland Street'}, {type: 'gas', name: 'Royal Reptile Gasoline'}, {type: 'fire', name: 'Flanagan Fire Department'}, {type: 'hospital', name: 'Saint Ingaborg Hospital'}, {type: 'suicide', name: 'Rollins Building'}, {type: 'museum', name: 'Hiltzik Library'}, {type: 'street', name: 'Strong Street'}, {type: 'bank', name: 'Veritech Bank'}, {type: 'car', name: 'Union Storage'}, {type: 'car', name: 'Union Storage'}],
                    [{type: 'street', name: 'Jackson Street'}, {type: 'store', name: "Ben 's Pet Shelter"}, {type: 'clothes', name: "Yeti's Costume Shop"}, {type: 'store', name: 'TerraAqua plants'}, {type: 'street', name: 'Flanagan Street'}, {type: 'school1', name: 'Finnegan Highschool'}, {type: 'school2', 'name': 'Finnegan Highschool'}, {type: 'apothecary', name: 'Green Man Health'}, {type: 'car', name: 'Union Storage'}, {type: 'car', name: 'Union Storage'}],
                    [{type: 'bar', name: 'The Jelly Moon'}, {type: 'stadium4', name: 'Landis Stadium Locker Room'}, {type: 'stadium5', name: 'Landis Stadium Skybox'}, {type: 'stadium6', name: 'Landis Stadium Locker Room'}, {type: 'clothes', name: "Possums Sports Memorabilia"}, {type: 'street', name: 'Bertino Lane'}, {type: 'store', name: 'Perfect Hair Forever Salon'}, {type: 'club', name: "Vinny's Bowling"}, {type: 'store', name: 'Hot Oven Bakery'}, {type: 'clothes', name: 'Classy Formalwear'}],
                    [{type: 'store', name: "Mike's Furniture Store"}, {type: 'stadium3', name: 'Landis Stadium Storeroom'}, {type: 'stadiumfield', name: 'Landis Stadium Field'}, {type: 'stadium7', name: 'Landis Stadium Guard Center'}, {type: 'bar', name: 'Gentlemen Of Football club'}, {type: 'home', name: 'House'}, {type: 'suicide', name: 'Zane Hotel'}, {type: 'store', name: 'We Repair It Electronics'}, {type: 'museum', name: 'Revolutionary Museum'}, {type: 'street', name: 'Yelchin Street'}],
                    [{type: 'street', name: 'Combs Street'}, {type: 'stadium2', name: 'Landis Stadium Gift Shop'}, {type: 'stadium1', name: 'Landis Stadium Gates'}, {type: 'stadium8', name: 'Landis Stadium Concessions'}, {type: 'club', name: 'Night of the Stormrider'}, {type: 'parktopleft', name: 'Murphy Park'}, {type: 'parktopright', name: 'Murphy Park'}, {type: 'club', name: 'Stoneman Arcade'}, {type: 'street', name: 'Saxon Street'}, {type: 'cops', name: 'Yelchin Police Department'}],
                    [{type: 'bank', name: 'Altuca Bank'}, {type: 'street', name: 'Barker Avenue'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'work', name: 'A Worksite'}, {type: 'mansion', name: 'Hell House'}, {type: 'parkbottomleft', name: 'Murphy Park'}, {type: 'parkbottomright', name: 'Murphy Park'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'street', name: 'Winfield Road'}, {type: 'street', name: 'Warner Street'}],
                    [{type: 'store', name: "Vail's Magic Shop"}, {type: 'powersub', name: 'Fairview Hights Relay Station'}, {type: 'food', name: 'Spice Buds Indian Cuisine'}, {type: 'food', name: 'Three Brothers Pizza'}, {type: 'club', name: 'The Rootin Tootin Bar'}, {type: 'garage', name: 'TireCenter Repairs'}, {type: 'suicide', name: 'GCTV building'}, {type: 'clothes', name: 'Face\'s Masks and Costumes'}, {type: 'suicide', name: 'Pullman Building'}, {type: 'clothes', name: "Diane's Dancewear"}],
                    [{type: 'street', name: 'Lenzi Street'}, {type: 'suicide', name: 'Alfredson Building'}, {type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'store', name: 'Golden Eagle Comics'}, {type: 'factory', name: 'A Warehouse'}, {type: 'gas', name: 'Tirecenter Gas Station'}, {type: 'super1', name: 'Low End Grocers'}, {type: 'super2', name: 'Low End Grocers'}, {type: 'waste', name: 'A Wasteland'}, {type: 'factory', name: 'A Factory'}],
                ];
            case 'Rockwell':
                return [
                    [{type: 'street', name: 'Dowdle Road'}, {type: 'work', name: 'A Worksite'}, {type: 'street', name: 'Cunningham Road'}, {type: 'bar', name: 'Neo Hokkaido'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'museum', name: 'Shaw Library'}, {type: 'store', name: 'Aja High'}, {type: 'store', name: 'Aja High'}, {type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'cops', name: 'Lovelock Police Department'}],
                    [{type: 'factory', name: "Sam's Junk Collection"}, {type: 'waste', name: 'A Wasteland'}, {type: 'store', name: "Ruth's Gadget Store"}, {type: 'cemetery', name: 'Illagoth Cemetery'}, {type: 'museum', name: 'Palmer Library'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'street', name: 'Peele Street'}, {type: 'suicide', name: 'Henshall Building'}, {type: 'street', name: 'Wagner Street'}],
                    [{type: 'street', name: 'Brimley Street'}, {type: 'store', name: 'Lioneye Records'}, {type: 'street', name: 'Roth Street'}, {type: 'museum', name: 'Grime City Space Museum'}, {type: 'park', name: 'Pucci Park'}, {type: 'park', name: 'Pucci Park'}, {type: 'park', name: 'Pucci Park'}, {type: 'park', name: 'Pucci Park'}, {type: 'street', name: 'Hansen Street'}, {type: 'store', name: 'Aster Automotive'}],
                    [{type: 'food', name: '5 Star Steakhouse'}, {type: 'store', name: "Belle's Second Hand Store"}, {type: 'street', name: 'Bradley Lane'}, {type: 'clothes', name: 'Skiffington Jewelry'}, {type: 'park', name: 'Pucci Park'}, {type: 'park', name: 'Pucci Park'}, {type: 'park', name: 'Pucci Park'}, {type: 'park', name: 'Pucci Park'}, {type: 'store', name: 'Vegan Delights Bakery'}, {type: 'museum', name: 'Grime City General Museum'}],
                    [{type: 'factory', name: 'A Warehouse'}, {type: 'laz', name: 'Helix Building', link: 'Helix Building (Rockwell)'}, {type: 'food', name: 'Hanh Pho'}, {type: 'street', name: 'Crash Road'}, {type: 'food', name: 'Takehito Ramen'}, {type: 'chicken', name: "Arlena's Chicken"}, {type: 'work', name: 'A Worksite'}, {type: 'store', name: 'Perkins Hotel'}, {type: 'god', name: 'Mosque'}, {type: 'street', name: 'Byrne Street'}],
                    [{type: 'store', name: 'Begsby Post Office'}, {type: 'factory', name: 'A Factory'}, {type: 'street', name: 'Begsby Lane'}, {type: 'store', name: 'Marshall Funeral Home'}, {type: 'street', name: 'Lustig Street'}, {type: 'super', name: 'Lablaw Grocery'}, {type: 'super', name: 'Lablaw Grocery'}, {type: 'work', name: 'A Worksite'}, {type: 'store', name: "Gilad's Hardware Store"}, {type: 'waste', name: 'A dump'}],
                    [{type: 'street', name: 'Comanche Street'}, {type: 'store', name: 'Nerd Supernova Collectables'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'street', name: 'Kentis Street'}, {type: 'work', name: 'A Worksite'}, {type: 'theatre', name: 'Craven Theatre'}, {type: 'burg', name: 'Goop Beast Burgers'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'bank', name: 'Giotto Bank and Lending'}, {type: 'store', name: 'Lockhart Salon'}],
                    [{type: 'clothes', name: "Randi Frescamilla's Beachwear"}, {type: 'hospital', name: 'Lychwood Smith Hospital'}, {type: 'cornerstore', name: 'Dwyer Provider'}, {type: 'bar', name: "Hell Rider's Bar"}, {type: 'parking', name: 'A Parking Lot'}, {type: 'fire', name: 'Cregger Fire Department'}, {type: 'mall', name: 'Rockwell Mall'}, {type: 'mall', name: 'Rockwell Mall'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'clothes', name: "Toni's Dancewear"}],
                    [{type: 'street', name: 'Tiger Shark Street'}, {type: 'secret', name: 'Very Abnormal Street'}, {type: 'gas', name: 'Rex Gas'}, {type: 'street', name: 'Fincher Avenue'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'mall', name: 'Rockwell Mall'}, {type: 'mall', name: 'Rockwell Mall'}, {type: 'guns', name: "Sleepy's Custom Firearms"}, {type: 'street', name: 'Scrimshaw Street'}],
                    [{type: 'work', name: 'A Worksite'}, {type: 'suicide', name: 'Scott Building'}, {type: 'street', 'name': 'Friedkin Lane'}, {type: 'cops', name: 'Fincher Police Department'}, {type: 'street', name: 'Lynch Street'}, {type: 'street', name: 'Cregger Avenue'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'parking', name: 'A Parking Lot'}, {type: 'powersub', name: 'Rockwell Relay Station'}, {type: 'hospital', name: "Rosello's Pharmacy"}]
                ];
                // Add cases for other suburbs if needed
            default:
                return null; // Return null if suburb not found
        }
    }

    // Function to get color by type
    function getColorByType(type) {
        switch (type) {
            // Special & Unique Buildings
            case 'laz': return '#cb00ff'; // Helix Buildings
            case 'powersub': return '#FFFF00'; // Power Relay Stations
            case 'hole': return '#403e3e'; // Strange Hole, Destroyed Buildings
            case 'secret': return '#403e3e'; // Secret/Abnormal locations
            case 'god': return '#FFFFFF'; // Churches, Temples, Mosques etc.
            case 'home': return '#FF4500'; // Houses, Residences, Apartments
            case 'suicide': return '#8B4513'; // Large buildings, Towers, Hotels

            // Faction Buildings
            case 'cops': return '#3f57d0'; // Police Departments
            case 'fire': return '#d03f3f'; // Fire Departments (New Color)
            case 'hospital': return '#FFB6C1'; // Hospitals, Clinics, Pharmacy
            case 'guns': return '#3f57d0'; // Gun Stores

            // Commercial & Services
            case 'mall': return '#56cea6';
            case 'super': return '#70FC97'; // Supermarkets
            case 'bank': return '#DAA520';
            case 'gas': return '#FFA500';
            case 'cornerstore': return '#B0B0B0';
            case 'laundry': return '#B0B0B0';
            case 'butcher': return '#B0B0B0';
            case 'car': return '#B0B0B0'; // Car Repair, Storage
            case 'garage': return '#B0B0B0'; // Garages, Automotive
            case 'gym': return '#B0B0B0';
            case 'theatre': return '#B0B0B0';
            case 'museum': return '#B0B0B0';
            case 'clothes': return '#FA6B36'; // Clothing, Jewelry
            case 'tarot': return '#B0B0B0';
            case 'store': return '#B0B0B0'; // Generic Stores

            // Food & Drink
            case 'food': return '#B0B0B0';
            case 'donut': return '#B0B0B0';
            case 'bar': return '#B0B0B0';
            case 'chicken': return '#B0B0B0';
            case 'burg': return '#B0B0B0';
            case 'club': return '#B0B0B0'; // Nightclubs, Arcades, Bowling (New Generic Type)

            // Industrial & Infrastructure
            case 'factory': return '#A9A9A9'; // Darker Grey for Factories
            case 'work': return '#B0B0B0'; // Work Sites
            case 'waste': return '#6B4226'; // Brown for Waste, Dumps
            case 'cemetery': return '#8F9779'; // Greenish-grey for Cemeteries

            // Generic / Outdoor
            case 'street': return '#CCCCCC'; // Lighter Grey for Streets
            case 'parking': return '#E0E0E0'; // Even Lighter for Parking
            case 'park': return '#00ff19';
            case 'zoo': return '#90EE90'; // Light Green for Zoo areas

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
