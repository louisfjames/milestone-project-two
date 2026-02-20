// -------------------------------------
// Search bar code utilising Skiddle API 
// -------------------------------------

// jQuery is the code language of choice for this project

// All wrapped in (document).ready(function) to ensure this code is run after the html document is full loadeed.
$(document).ready(function () {

    // API key stored as const as will need throughout code
    const SKIDDLE_API_KEY = "481b24e5efaa9cbb9433c9119edda0d9";

    // Global constants
    const ARTIST_CAP = 10; // To allow for cap on artists shown in lineup on searches

    // DOM Elements
    const $searchBtn = $("#search-btn");
    const $searchBox = $("#search-box");
    const $resultsDiv = $("#results");
    const $statusDiv = $("#status");

    // Search Bar Click Handler
    $searchBtn.on("click", function () { 
        const query = $searchBox.val().trim(); 

        if (query === "") {
            $statusDiv.text("Please enter an artist name."); 
            return; 
        }
        
        $resultsDiv.empty();
        $statusDiv.text(`Searching for "${query}"…`);

    // API Parameters Request

    const today = new Date().toISOString().split("T")[0]; // This was the best way to identify today's date for the minDate API parameter 

    const params = {
    api_key: SKIDDLE_API_KEY,
    keyword: query,
    eventcode: "FEST",
    minDate: today,
    description: "1",
    limit: "100", //the limit is stated on the Skiddle API GitHub documentation 
    order: "date"
    };

    const url = "https://www.skiddle.com/api/v1/events/search/?" + $.param(params); // turns the object into a query string 

    // API call and filter by artist
    
    $.getJSON(url, function (data) { // Request to the Skiddle API 
        $statusDiv.text("");

        if (!data.results) { // Checking if the API actually returned results 
            $resultsDiv.text("No festivals found."); 
            return;
        }

        const lower = query.toLowerCase(); // Prepare the user’s search term for matching 

        const filtered = data.results.filter(event => // Filtering the API results to find festivals featuring that artist 
            event.artists &&
            event.artists.some(a => a.name.toLowerCase() === lower)
        );

        if (filtered.length === 0) { 
            $resultsDiv.text("No matches found."); // Showing a message if there are no matches found 
            return;
        }

        filtered.forEach(event => {
            const $card = $("<div>").addClass("event-card"); // Creating an card container for each festival 
            // Adding the festival image to card container 
            const $img = $("<img>") 
                .attr("src", event.largeimageurl || event.imageurl || "https://via.placeholder.com/140?text=No+Image") // Good practice to include placeholder link in case API doesn't return an image
                .attr("alt", event.eventname);

            // Creating a container for the text 
            const $info = $("<div>").addClass("event-info"); 

            // Adding festival name to card container 
            const $title = $("<h3>").text(event.eventname); 

            // Adding metadata to card container 
            const $meta = $("<div>") 
                .addClass("event-meta")
                .text(`${event.venue?.name || "Unknown venue"} – ${event.venue?.town || ""} – ${event.date}`); // Ensures venue, location and date are included in metadata
            
            // Adding festival description to card container
            const $desc = $("<p>") 
                .addClass("event-description")
                .text(event.description || "No description available.");
            
            // Adding festival lineup to card container, highlighting searched artist in the lineup,  calling artist cap and 'read more' button
            const lower = query.toLowerCase(); // To make the artist name comparison below case-insenstive

            const artists = event.artists || [];
            const processedArtists = artists.map(a => {
                return a.name.toLowerCase() === lower 
                    ? `<span class="highlight-artist">${a.name}</span>` // Highlighting the searched artist
                    : a.name;
            });

            const visibleArtists = processedArtists.slice(0, ARTIST_CAP).join(", ");  // The purpose of this is to call artist cap to only show 10 artists on lineup
            const hiddenArtists = processedArtists.slice(ARTIST_CAP).join(", ");  // Split into visible + hidden sections

            let lineupHTML = `Lineup: ${visibleArtists}`;

            if (hiddenArtists.length > 0) {
                lineupHTML += `
                    <span class="more-artists" style="display:none;">, ${hiddenArtists}</span>
                    <button class="read-more-btn">Read more</button>
                `; // Read more button links to read-more-btn class and runs toggle function included in first section of script.js 
            }

            const $lineup = $("<p>") // Adding lineup to card container
                .addClass("event-lineup")
                .html(lineupHTML); // The only way to allow css to work is to make the output html rather than text
            
            // Assembling the card container
            $info.append($title, $meta, $desc, $lineup); 
            $card.append($img, $info);
            $resultsDiv.append($card); // This adds the card to the results section of index.html 
        });

        }).fail(function (error) { // Catching any errors from the API requst 
        console.error(error);
        $statusDiv.text("Error fetching events. Check the console.");
        });

    });

});
