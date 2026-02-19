// -------------------------------------
// Search bar code utilising Skiddle API 
// -------------------------------------

// jQuery is the code language of choice for script.js

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

    const today = new Date().toISOString().split("T")[0]; /* This was the best way to identify today's date for the minDate API parameter */

    const params = {
    api_key: SKIDDLE_API_KEY,
    keyword: query,
    eventcode: "FEST",
    minDate: today,
    description: "1",
    limit: "100",
    order: "date"
    };


    // API call to be added here
 
    });

});
