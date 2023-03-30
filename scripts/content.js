var roomObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            // element added to DOM
            [].forEach.call(mutation.addedNodes, function(el) {
                if(el.classList != null && el.classList.contains('ps-room-opaque')) {
                    initTeraObserver(el, false);
                }
            });
        }
    });
});

function initTeraObserver(room, isPageReload) {
    // fix for weird issue on page reload (switching position with opponent)
    let teraCount = 0;
    var teraObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            // element added to DOM
            [].forEach.call(mutation.addedNodes, function(el) {
                if(el.classList != null && el.classList.contains('battle-history')) {
                    // Check if Tera message
                    if(el.innerText != null &&
                        el.innerText != '' &&
                        el.innerText.includes('The opposing') &&
                        el.innerText.includes('has Terastallized')) {
                        // Retrieve pkmn
                        let pkmName = betweenMarkers(el.innerText, 'The opposing ', ' has Terastallized');
                        // Retrieve type
                        let pkmType = betweenMarkers(el.innerText, 'into the ', '-type!');
                        chrome.storage.sync.get({
                            ditFontSize: 11,
                            ditTextColor: '#000000'
                        }, function(items) {
                            // Create info element
                            let teraInfo = `<div class="teraInfo" style="width: 85px;position: absolute;right: 2px;top: calc(${getTrainerInfoHeight(room)}px + 45px);color: ${items.ditTextColor};text-align: left;font-size: ${items.ditFontSize}px;line-height: 16px;">
                            <span style="word-break: break-all;"><b style="display: block;">Tera:</b>${pkmName}</span>
                            <span><b style="display: block;margin-top: 2px;">Type:</b>${pkmType}</span>
                            </div>`;
                            room.querySelectorAll('.innerbattle .rightbar')[0].insertAdjacentHTML('afterend', teraInfo);
                            // Tera used - stop MutationObserver
                            if(!isPageReload || teraCount >= 1) {
                                teraObserver.disconnect();
                            }
                            else
                                teraCount++;
                    });
                    }
                }
            });
        }
    });
    });
    teraObserver.observe(room, config);
}

var config = {
    childList: true,
    subtree: true,
};

// Start Observer for new Battles
roomObserver.observe(document.body, config);

// Check the existing Battles, eg. in case of page reload
addEventListener("load", (event) => {
    setTimeout(() => {
        [...document.getElementsByClassName('ps-room-opaque')].forEach(el => {
            initTeraObserver(el, true);
        });
    }, 500);
});

/* CSS utils */
function getTrainerInfoHeight(room) {
    return room.querySelectorAll('.innerbattle .rightbar .trainer')[0].offsetHeight;
}

/* String utils */
function betweenMarkers(text, begin, end) {
    var firstChar = text.indexOf(begin) + begin.length;
    var lastChar = text.indexOf(end);
    var newText = text.substring(firstChar, lastChar);
    return newText;
}
