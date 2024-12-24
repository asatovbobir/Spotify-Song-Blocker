let currentSong = '';
let observer = null;
let retryCount = 0;
const MAX_RETRIES = 40;
let isSkipping = false;
let skipQueue = [];

function logWithTimestamp(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

async function checkAndBlockSong() {
    const nowPlayingWidget = document.querySelector('[data-testid="now-playing-widget"]');
    if (!nowPlayingWidget) return;
    
    const songTitleElement = nowPlayingWidget.querySelector('[data-testid="context-item-link"]');
    if (!songTitleElement) return;
    
    const songTitle = songTitleElement.textContent?.trim();
    if (!songTitle) return;
    
    if (songTitle === currentSong) {
        return;
    }
    
    logWithTimestamp(`Detected new song: ${songTitle}`);
    currentSong = songTitle;

    try {
        const result = await chrome.storage.sync.get(['blockedSongs']);
        const blockedSongs = result.blockedSongs || [];
        const isBlocked = blockedSongs.some(blocked => 
            songTitle.toLowerCase().includes(blocked.toLowerCase())
        );
        
        if (isBlocked) {
            logWithTimestamp(`Song "${songTitle}" is blocked. Queueing for skip.`);
            queueSkip(songTitle);
        } else {
            logWithTimestamp(`Song "${songTitle}" is allowed to play.`);
        }
    } catch (error) {
        console.error('Error accessing blocked songs:', error);
    }
}

function queueSkip(songTitle) {
    skipQueue.push(songTitle);
    if (!isSkipping) {
        processSkipQueue();
    }
}

async function processSkipQueue() {
    if (skipQueue.length === 0) {
        isSkipping = false;
        return;
    }

    isSkipping = true;
    const songToSkip = skipQueue.shift();
    await skipSong(songToSkip);
    processSkipQueue();
}

function forceClickElement(element) {
    if (!element) return false;
    
    try {
        element.click();
        
        const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(clickEvent);
        
        logWithTimestamp('Skip button clicked using multiple methods');
        return true;
    } catch (error) {
        console.error('Error clicking skip button:', error);
        return false;
    }
}

async function retrySkip(songTitle) {
    while (retryCount < MAX_RETRIES) {
        retryCount++;
        const delay = Math.min(500 * Math.pow(1.1, retryCount), 2000);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        logWithTimestamp(`Retry attempt ${retryCount} for skipping "${songTitle}"`);
        
        const nextButton = document.querySelector('[data-testid="control-button-skip-forward"]');
        if (nextButton) {
            logWithTimestamp('Skip button found, attempting to click...');
            if (forceClickElement(nextButton)) {
                logWithTimestamp(`Successfully clicked skip button on retry ${retryCount}`);
                retryCount = 0;
                
                await new Promise(resolve => setTimeout(resolve, 500));
                const currentTitle = document.querySelector('[data-testid="context-item-link"]')?.textContent?.trim();
                if (currentTitle === songTitle) {
                    logWithTimestamp('Skip may have failed, song still playing. Retrying...');
                    continue;
                } else {
                    return true;
                }
            } else {
                logWithTimestamp('Click attempt failed, retrying...');
            }
        } else {
            logWithTimestamp('Skip button not found, retrying...');
        }
    }
    
    console.error('Failed to skip song after maximum retries');
    retryCount = 0;
    return false;
}

async function skipSong(songTitle) {
    const nextButton = document.querySelector('[data-testid="control-button-skip-forward"]');
    logWithTimestamp('Skip button state:', nextButton ? 'found' : 'not found');
    
    if (nextButton) {
        logWithTimestamp('Attempting to skip...');
        if (forceClickElement(nextButton)) {
            logWithTimestamp(`Initial skip attempt successful for: ${songTitle}`);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            const currentTitle = document.querySelector('[data-testid="context-item-link"]')?.textContent?.trim();
            if (currentTitle === songTitle) {
                logWithTimestamp('Initial skip may have failed, starting retry process...');
                return retrySkip(songTitle);
            } else {
                return true;
            }
        } else {
            logWithTimestamp(`Skip button click failed for: ${songTitle}. Starting retry process...`);
            return retrySkip(songTitle);
        }
    } else {
        logWithTimestamp(`Skip button not found for: ${songTitle}. Starting retry process...`);
        return retrySkip(songTitle);
    }
}

function startObserving() {
    const nowPlayingBar = document.querySelector('[data-testid="now-playing-bar"]');
    if (!nowPlayingBar) {
        logWithTimestamp('Now playing bar not found. Retrying in 5 seconds...');
        setTimeout(startObserving, 5000);
        return;
    }

    observer = new MutationObserver(() => {
        checkAndBlockSong();
    });

    observer.observe(nowPlayingBar, {
        childList: true,
        subtree: true,
        characterData: true,
        attributeFilter: ['aria-valuenow']
    });

    const mainPlayer = document.querySelector('[data-testid="now-playing-widget"]');
    if (mainPlayer) {
        observer.observe(mainPlayer, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    logWithTimestamp('Observer started with enhanced monitoring');
}

function initialize() {
    if (observer) {
        observer.disconnect();
    }
    
    startObserving();
    
    setInterval(checkAndBlockSong, 500);
}

initialize();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'reinitialize') {
        logWithTimestamp('Reinitializing observer...');
        initialize();
    }
    sendResponse({ success: true });
});

