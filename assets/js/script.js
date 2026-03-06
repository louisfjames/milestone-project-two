// -------------------------------------
// Skiddle API Code
// -------------------------------------

// jQuery is the code language of choice for this project

// All wrapped in (document).ready(function) to ensure this code is run after the html document is full loadeed.
$(document).ready(function () {

    // API key stored as const as will need throughout code
    const SKIDDLE_API_KEY = "481b24e5efaa9cbb9433c9119edda0d9"; // API Key obtained through Skiddle directly

    // Global constants
    const ARTIST_CAP = 10; // To allow for cap on artists shown in lineup on searches

    // Featured festivals for Discover page - This is manually curated list
    const FEATURED_FESTIVALS = [
    "41408774", // Boomtown Festival
    "41496625", // TRNSMT Festival
    "41414028", // Reading Festival
    "41490996"  // All Points East
    ];

    // Lineup announcement for Discover page - This is manually curated similar to FEATURED_FESTIVALS
    const LINEUP_ANNOUNCEMENTS = [
        {
            id: "41398417", // Green Man Festival
            announced: "2026-03-03" // Date of lineup announcement
        }
    ];

    // DOM Elements
    const $searchBtn = $("#search-btn");
    const $searchBox = $("#search-box");
    const $resultsDiv = $("#results");
    const $statusDiv = $("#status");
    const $modeToggle = $("#mode-toggle"); 

    // Allows user to use enter on keyboard to activate search bar
    $searchBox.on("keydown", function (enter) {
        if (enter.key === "Enter") {
            enter.preventDefault();
            $searchBtn.click();
        }
    });
    
    // 'Read More' Click Handler (found within card containers after searching) - Needs to go before search bar otherwise ther 'read more' toggle will cancel itself out on a second search
    $(document).on("click", ".read-more-link", function () {
        const $btn = $(this);
        const $hidden = $btn.prev(".more-artists");

        if ($hidden.is(":visible")) {
            $hidden.slideUp(500);
            $btn.text("Read more");
        } else {
            $hidden.slideDown(500);
            $btn.text("Show less");
        }
    });

    // Search Bar Click Handler
    $searchBtn.on("click", function () { 
        const query = $searchBox.val().trim(); 
        const mode = $modeToggle.val();

        if (query === "") {
            const label = mode === "artist" ? "an artist name"
                    : mode === "festival" ? "a festival name"
                    :  "a city"; // default mode set to "city" as "artist" and "festival" are listed above so no need to list "city" in code

            $statusDiv.text(`Please enter ${label}.`); 
            return; 
        }
        
        const ukOnly = $("#uk-only-toggle").is(":checked"); // The UK-only toggle on search page

        $resultsDiv.empty();
        $statusDiv.text(`Searching for "${query}"…`);


    // API Parameters Request

    const today = new Date().toISOString().split("T")[0]; // This was the best way to identify today's date for the minDate API parameter 

    const params = {
    api_key: SKIDDLE_API_KEY,
    keyword: query,
    eventcode: "FEST", // This ensures that only festivals are called to the website as Skiddle API also has other categories of events
    minDate: today,
    description: "1",
    limit: "100", // This limit is stated on the Skiddle API GitHub documentation 
    order: "date"
    };
    
    const url = "https://www.skiddle.com/api/v1/events/search/?" + $.param(params); // turns the object into a query string 


    // -------------------------------------
    // Search bar code utilising Skiddle API 
    // -------------------------------------
    
    // API call and filter by artist
    $.getJSON(url, function (data) { // Request to the Skiddle API 
        $statusDiv.text("");

        if (!data.results) { // Checking if the API actually returned results 
            $resultsDiv.text("No festivals found."); 
            return;
        }

        const lower = query.toLowerCase(); // Prepare the user’s search term for matching 
        const mode = $modeToggle.val(); // Switches search mode (i.e. artist, festival or city) using the toggle

        
        let filtered; // Filtering the API results to find festivals based on the search mode

        switch (mode) {
            case "artist": // Search mode by artist
                filtered = data.results.filter(event =>
                    event.artists &&
                    event.artists.some(a => a.name.toLowerCase() === lower)
                );
                break;
            case "festival": // Search mode by festival
                filtered = data.results.filter(event =>
                    event.eventname.toLowerCase().includes(lower)
                );
                break;

            case "city": // Search mode by city
                filtered = data.results.filter(event =>
                    event.venue?.town?.toLowerCase().includes(lower)
                );
                break;
            default:
                filtered = data.results;
        }

        if (ukOnly) { // If the UK‑only toggle is active, keep only events whose venue.country is "GB". The Skiddle API holds venue.country data for each festival
        filtered = filtered.filter(event =>
            event.venue?.country?.toUpperCase() === "GB"
            );
        }

        if (filtered.length === 0) { 
            $resultsDiv.text("No matches found."); // Showing a message if there are no matches found 
            return;
        }

        filtered.forEach(event => {
            const $card = $("<div>").addClass("event-card"); // Creating an card container for each festival 
            // Adding the festival image to card container 
            const $img = $("<img>") 
                .attr("src", event.largeimageurl)
                .attr("alt", event.eventname);

            // Creating a container for the text 
            const $info = $("<div>").addClass("event-info"); 

            // Adding festival name to card container 
            const $title = $("<h2>").text(event.eventname); 

            // Adding metadata to card container 
            const dateObj = new Date(event.date);
            const formattedDate = dateObj.toLocaleDateString("en-GB");  // Ensures the date is in the UK standard format

            const $meta = $("<div>") 
                .addClass("event-meta") // Ensures venue, location and date are included in metadata.
                .html(`
                    <span><i class="fa-solid fa-location-dot"></i> ${event.venue?.name || "Unknown venue"} – ${event.venue?.town || ""}</span>
                    <span><i class="fa-solid fa-calendar-day"></i> ${formattedDate}</span>
                `); // Used <span> to allow for control when styling for small screens.
            
            // Adding festival description to card container
            const $desc = $("<p>") 
                .addClass("event-description")
                .html(`<strong>Info:</strong> ${event.description || "No description available."}`);
            
            // Adding festival lineup to card container, highlighting searched artist in the lineup,  calling artist cap and 'read more' button
            const artists = event.artists || [];

            const processedArtists = artists.map(a => {
                return a.name.toLowerCase() === lower 
                    ? `<span class="highlight-artist">${a.name}</span>` // Highlighting the searched artist
                    : a.name;
            });

            const visibleArtists = processedArtists.slice(0, ARTIST_CAP).join(", ");  // The purpose of this is to call artist cap to only show 10 artists on lineup
            const hiddenArtists = processedArtists.slice(ARTIST_CAP).join(", ");  // Split into visible + hidden sections

            let lineupHTML = `<strong>Lineup:</strong> ${visibleArtists}`;

            if (hiddenArtists.length > 0) {
                lineupHTML += `
                    <span class="more-artists" style="display:none;">, ${hiddenArtists}</span>
                    <a class="read-more-link">Read more</a>
                `; // Read more button links to read-more-btn class and runs toggle function included in first section of script.js 
            }

            const $lineup = $("<p>") // Adding lineup to card container
                .addClass("event-lineup")
                .html(lineupHTML); // The only way to allow css to work is to make the output html rather than text

            // Adding tickets button to card containers (with fallback directing user to Skiddle)
            const ticketURL = event.tickets || event.link;

            const $ticketsLink = $("<button>")
                .addClass("event-button")
                .text(event.tickets ? "Buy Tickets" : "Check Tickets on Skiddle")
                .on("click", () => {
                    window.open(ticketURL, "_blank");
                })

            // Assembling the card container
            $info.append($title, $meta, $desc, $lineup); 
            $card.append($img, $info);
            $info.append($ticketsLink);
            $resultsDiv.append($card); // This adds the card to the results section of index.html 

            // Adding fallback to festivals who have no lineup information on Skiddle API
            if (artists.length === 0) {
                $lineup.html("<strong>Lineup:</strong> <i>Lineup coming soon.</i>");
            }

        });

        }).fail(function (error) { // Catching any errors from the API requst 
        console.error(error);
        $statusDiv.text("Error fetching events. Check the console.");
        });

    });

    // --------------------------------------------
    // Discover page features utilising Skiddle API 
    // --------------------------------------------
    
    // Fetch a single festival by ID (ID's are listed at the top of JavaScript)
    function fetchFestivalById(id) {
        return $.getJSON(`https://www.skiddle.com/api/v1/events/${id}/?api_key=${SKIDDLE_API_KEY}`);
    }

    // First Section - Load 'Featured Festivals' into carousel using card containers
    function loadFeaturedFestivals() {
        const requests = FEATURED_FESTIVALS.map(id => fetchFestivalById(id)); // FEATURED_FESTIVALS listed at the top of JavaScript

        Promise.all(requests) // Using the Promise.all() static method which takes an iterable of promises as input and returns a single Promise
            .then(results => {
                const $carouselInner = $("#featured-carousel-inner");

                results.forEach((data, index) => {
                    const event = data.results;

                    const dateObj = new Date(event.date);
                    const formattedDate = dateObj.toLocaleDateString("en-GB"); // Formatting date in GB format

                    const artists = event.artists?.map(a => a.name).join(", ");

                    // Building the corousel items using HTML
                    const item = `
                        <div class="carousel-item ${index === 0 ? "active" : ""}">
                            <div class="container py-4">
                                <div class="row align-items-center">
                                    
                                    <!-- Festival poster to the left of the card container -->
                                    <div class="col-md-4 text-center">
                                        <img src="${event.largeimageurl || event.imageurl}" 
                                            class="img-fluid rounded event-poster" 
                                            alt="${event.eventname}">
                                    </div>

                                    <!-- Festival details to the left of the card container -->
                                    <div class="col-md-8 pt-3">
                                        <h3 class="mb-2">${event.eventname}</h3>

                                        <p class="event-meta mb-2">
                                            <i class="fa-solid fa-location-dot"></i> 
                                            ${event.venue?.name || "Unknown venue"} – ${event.venue?.town || ""}
                                            &nbsp;&nbsp;
                                            <i class="fa-solid fa-calendar-day"></i> 
                                            ${formattedDate}
                                        </p>

                                        <p class="event-lineup mb-2">
                                            <strong>Lineup:</strong> ${artists}
                                        </p>

                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    $carouselInner.append(item); 
                });
            })
            .catch(err => console.error("Featured festival error:", err)); // Error handling
    }

    // Second Section - Load event into Lineup Announcements section
    function loadLineupAnnouncements() {
        // This section calls Skiddle event number and manually entered date added at the top of script.js
        const announcement = LINEUP_ANNOUNCEMENTS[0]; 
        const eventID = announcement.id; 
        const announcedDate = announcement.announced; 
        
        const url = `https://www.skiddle.com/api/v1/events/${eventID}/?api_key=${SKIDDLE_API_KEY}`;

        $.getJSON(url)
            .done(data => {
                const event = data.results;

                if (!event) {
                    $("#lineup-announcements").html("<p>Unable to load lineup announcement.</p>");
                    return;
                }

                // Build card exactly like your search results
                const $card = $("<div>").addClass("event-card");

                // Image
                const $img = $("<img>")
                    .attr("src", event.largeimageurl || event.imageurl)
                    .attr("alt", event.eventname);

                // Info container
                const $info = $("<div>").addClass("event-info");

                // Title
                const $title = $("<h2>").text(event.eventname);

                // Announcement date
                let $announced = null;
                if (announcedDate) {
                    const formattedAnnouncement = new Date(announcedDate).toLocaleDateString("en-GB");
                    $announced = $("<div>")
                        .addClass("announcement-badge")
                        .html(`Announced: ${formattedAnnouncement}`);
                }

                // Date formatting
                const dateObj = new Date(event.date);
                const formattedDate = dateObj.toLocaleDateString("en-GB");

                // Metadata
                const $meta = $("<div>")
                    .addClass("event-meta")
                    .html(`
                        <span><i class="fa-solid fa-location-dot"></i> ${event.venue?.name || "Unknown venue"} – ${event.venue?.town || ""}</span>
                        <span><i class="fa-solid fa-calendar-day"></i> ${formattedDate}</span>
                    `);

                // Description
                const $desc = $("<p>")
                    .addClass("event-description")
                    .html(`<strong>Info:</strong> ${event.description || "No description available."}`);

                // Lineup
                const artists = event.artists || [];
                const processedArtists = artists.map(a => a.name);

                const visibleArtists = processedArtists.slice(0, ARTIST_CAP).join(", ");
                const hiddenArtists = processedArtists.slice(ARTIST_CAP).join(", ");

                let lineupHTML = `<strong>Lineup:</strong> ${visibleArtists}`;

                if (hiddenArtists.length > 0) {
                    lineupHTML += `
                        <span class="more-artists" style="display:none;">, ${hiddenArtists}</span>
                        <a class="read-more-link">Read more</a>
                    `;
                }

                const $lineup = $("<p>")
                    .addClass("event-lineup")
                    .html(lineupHTML);

                // Tickets button
                const ticketURL = event.tickets || event.link;

                const $ticketsLink = $("<button>")
                    .addClass("event-button")
                    .text(event.tickets ? "Buy Tickets" : "Check Tickets on Skiddle")
                    .on("click", () => window.open(ticketURL, "_blank"));

                // Assemble card
                $info.append($announced, $title, $meta, $desc, $lineup, $ticketsLink);
                $card.append($img, $info);

                // Insert into announcements section
                $("#lineup-announcements").empty().append($card);

                // Fallback for no lineup
                if (artists.length === 0) {
                    $lineup.html("<strong>Lineup:</strong> <i>Lineup coming soon.</i>");
                }
            })
            .fail(err => {
                console.error("Lineup announcement API error:", err);
                $("#lineup-announcements").html("<p>Error loading lineup announcement.</p>");
            });
    }

    // Third Section - Generate a random festival card for 'Festival Spotlight'
    function loadRandomFestival() {
        const today = new Date().toISOString().split("T")[0];

        const params = {
            api_key: SKIDDLE_API_KEY,
            eventcode: "FEST",
            minDate: today,
            limit: "100",
            description: "1",
            order: "trending" // This filter used to make sure larger random festivals are selected
        };

        const url = "https://www.skiddle.com/api/v1/events/search/?" + $.param(params);

        // This code replicates the card containers created for the search function
        $.getJSON(url)
            .done(data => {
                if (!data.results || data.results.length === 0) {
                    $("#random-festival").html("<p>No festivals found.</p>");
                    return;
                }

                // UK-only filter
                let ukFestivals = data.results.filter(event =>
                    event.venue?.country?.toUpperCase() === "GB"
                );

                if (ukFestivals.length === 0) {
                    $("#random-festival").html("<p>No UK festivals found.</p>");
                    return;
                }

                // Pick a random UK festival
                const event = ukFestivals[Math.floor(Math.random() * ukFestivals.length)];

                // Build card exactly like search results
                const $card = $("<div>").addClass("event-card");

                const $img = $("<img>")
                    .attr("src", event.largeimageurl || event.imageurl)
                    .attr("alt", event.eventname);

                const $info = $("<div>").addClass("event-info");

                const $title = $("<h2>").text(event.eventname);

                const dateObj = new Date(event.date);
                const formattedDate = dateObj.toLocaleDateString("en-GB");

                const $meta = $("<div>")
                    .addClass("event-meta")
                    .html(`
                        <span><i class="fa-solid fa-location-dot"></i> ${event.venue?.name || "Unknown venue"} – ${event.venue?.town || ""}</span>
                        <span><i class="fa-solid fa-calendar-day"></i> ${formattedDate}</span>
                    `);

                const $desc = $("<p>")
                    .addClass("event-description")
                    .html(`<strong>Info:</strong> ${event.description || "No description available."}`);

                const artists = event.artists || [];
                const processedArtists = artists.map(a => a.name);

                const visibleArtists = processedArtists.slice(0, ARTIST_CAP).join(", ");
                const hiddenArtists = processedArtists.slice(ARTIST_CAP).join(", ");

                let lineupHTML = `<strong>Lineup:</strong> ${visibleArtists}`;

                if (hiddenArtists.length > 0) {
                    lineupHTML += `
                        <span class="more-artists" style="display:none;">, ${hiddenArtists}</span>
                        <a class="read-more-link">Read more</a>
                    `;
                }

                const $lineup = $("<p>")
                    .addClass("event-lineup")
                    .html(lineupHTML);

                const ticketURL = event.tickets || event.link;

                const $ticketsLink = $("<button>")
                    .addClass("event-button")
                    .text(event.tickets ? "Buy Tickets" : "Check Tickets on Skiddle")
                    .on("click", () => {
                        window.open(ticketURL, "_blank");
                    });

                $info.append($title, $meta, $desc, $lineup, $ticketsLink);
                $card.append($img, $info);

                $("#random-festival").empty().append($card);

                if (artists.length === 0) {
                    $lineup.html("<strong>Lineup:</strong> <i>Lineup coming soon.</i>");
                }
            })
            .fail(err => console.error("Random festival error:", err));
    }
    
    // Only load featured festivals on discover page
    if (window.location.pathname.includes("discover.html")) {
        loadFeaturedFestivals();
        loadRandomFestival();
        loadLineupAnnouncements();
    }

});
