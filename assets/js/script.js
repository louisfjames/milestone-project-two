// -------------------------------------
// Search bar code utilising Skiddle API 
// -------------------------------------

// jQuery is the code language of choice for this project

// All wrapped in (document).ready(function) to ensure this code is run after the html document is full loadeed.
$(document).ready(function () {

    // API key stored as const as will need throughout code
    const SKIDDLE_API_KEY = "481b24e5efaa9cbb9433c9119edda0d9";

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

            const $img = $("<img>") // Adding the festival image to card container 
            .attr("src", event.largeimageurl || event.imageurl || "https://via.placeholder.com/140?text=No+Image") // Good practice to include placeholder link in case API doesn't return an image
            .attr("alt", event.eventname);

            const $info = $("<div>").addClass("event-info"); // Creating a container for the text 
            const $title = $("<h3>").text(event.eventname); // Adding festival name to card container 
            const $meta = $("<div>") // Adding metadata to card container 
            .addClass("event-meta")
            .text(`${event.venue?.name || "Unknown venue"} – ${event.venue?.town || ""} – ${event.date}`); // Ensures venue, location and date are included in metadata
            const $desc = $("<p>") // Adding festival description to card container
            .addClass("event-description")
            .text(event.description || "No description available.");



            $info.append($title, $meta, $desc); // Assembling the card container
            $card.append($img, $info);
            $resultsDiv.append($card); // This adds the card to the results section of index.html 
        });

        }).fail(function (error) { // Catching any errors from the API requst 
        console.error(error);
        $statusDiv.text("Error fetching events. Check the console.");
        });

    });

});
