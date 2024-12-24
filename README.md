# Spotify Song Blocker for Google Chrome


## Overview

The Spotify Song Blocker is a Google Chrome extension designed to automatically skip specific songs on Spotify's web player. Users can block unwanted songs by adding their titles to a block list, ensuring a seamless and personalized listening experience. I created this due to boredom. (Works for the most part) Feel free to contribute or imrpove upon it.


## Features

* Automatic Song Detection: Detects the currently playing song on Spotify's web player.

* Custom Block List: Blocks songs based on user-defined titles.

* Retry Mechanism: Ensures blocked songs are skipped, even if initial attempts fail.

* Enhanced Monitoring: Uses Mutation Observers to track changes in Spotify's "Now Playing" bar.


## Installation

* Clone or download the repository.

* Open Google Chrome and navigate to chrome://extensions/.

* Enable Developer Mode using the toggle in the top-right corner.

* Click Load Unpacked and select the folder containing the extension files.

* The extension will now appear in your toolbar. Pin it for easy access!


## Usage

* Open the Spotify web player.

* Add songs you want to block by clicking on the extension.

* Play music as usual; the extension will automatically skip blocked songs.


## Technical Details

Language: JavaScript, HTML


## Key Methods:

* MutationObserver: Monitors changes in the DOM for real-time detection of songs.

* chrome.storage.sync: Saves and retrieves the block list.

* forceClickElement: Simulates user interaction with the "Skip" button.

* retrySkip: Retries skipping songs if initial attempts fail.


## Key Constants:

* MAX_RETRIES: Limits the number of retry attempts to 40.

* retryCount: Tracks retry attempts.
