var roomObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            // element added to DOM
            [].forEach.call(mutation.addedNodes, function(el) {
                if(el.classList != null && el.classList.contains('ps-room-opaque')) {
                    getOptionsAndInitTeraObserver(el, false);
                }
            });
        }
    });
});

/**
 * Adds a style tag with rules for close btn
 */
function injectStyles() {
    var styleElement = document.createElement('style');

    styleElement.innerHTML = `
        .ditCloseInfo {
          position: absolute;
          top: 0;
          transform: translateY(100%);
          opacity: 0;
          transition: .5s ease-in-out;
          cursor: pointer;
        }
        .ditCloseInfo svg {
          width: 12px;
        }
        .ditTeraInfo:hover .ditCloseInfo {
          opacity: 1;
          transform: translateY(0);
        }
        .ditCloseInfo path {
          fill: #424242;
          transition: fill .5s ease-in-out;
        }
        .ditCloseInfo:hover path {
          fill: #000;
        }
    `;

    document.head.appendChild(styleElement);
}
injectStyles();



function getOptionsAndInitTeraObserver(el, useDifferentMethod) {
  chrome.storage.sync.get({
    ditFontSize: 11,
    ditTextColor: '#000000',
    ditShowNicknames: false,
    ditShowBothUserTera: false,
  }, function(options) {
    initTeraObserver(el, useDifferentMethod, options);
  });
}

function initTeraObserver(room, isPageReload, options) {
    // fix for weird issue on page reload (switching position with opponent)
    let teraCount = 0;
    let teraCountLimit = 0;
    if(options.ditShowBothUserTera)
        teraCountLimit = 1;
    if(isPageReload)
        teraCountLimit++;
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
                        /* Opponent tera */
                        let currentUser = false;

                        // Retrieve pkmn
                        let pkmName = getPkmnName(el.innerText, currentUser, options.ditShowNicknames);
                        // Retrieve type
                        let pkmType = getPkmnType(el.innerText);

                        // Create info element
                        let teraInfo = getTeraInfo(room, pkmName, pkmType, options.ditFontSize, options.ditTextColor, currentUser);
                        appendTeraInfo(room, teraInfo, currentUser);
                        // Tera used - stop MutationObserver
                        if(teraCount >= teraCountLimit) {
                            teraObserver.disconnect();
                        }
                        else {
                            teraCount++;
                        }

                    } else if(el.innerText != null &&
                        el.innerText != '' &&
                        el.innerText.includes('has Terastallized') &&
                        options.ditShowBothUserTera) {
                        /* User tera */
                        let currentUser = true;

                        // Retrieve pkmn
                        let pkmName = getPkmnName(el.innerText, currentUser, options.ditShowNicknames);
                        // Retrieve type
                        let pkmType = getPkmnType(el.innerText);

                        // Create info element
                        let teraInfo = getTeraInfo(room, pkmName, pkmType, options.ditFontSize, options.ditTextColor, currentUser);
                        appendTeraInfo(room, teraInfo, currentUser);
                        // Tera used - stop MutationObserver
                        if(teraCount >= teraCountLimit) {
                            teraObserver.disconnect();
                        }
                        else {
                            teraCount++;
                        }
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
            getOptionsAndInitTeraObserver(el, true);
        });
    }, 500);
});

/* DOM manipulation */
function appendTeraInfo(room, teraInfo, currentUser) {
    let bar = getUserBar(currentUser);
    room.querySelectorAll('.innerbattle ' + bar)[0].insertAdjacentHTML('afterend', teraInfo);
}

function hideTeraInfo(elem) {
    var teraInfo = elem.parentNode;
    teraInfo.style.display = 'none';
}
// Add event listener to the DOM for clicks on elements with class '.ditCloseInfo'
document.addEventListener('click', function(event) {
  var clickedElem = event.target;
  var parentElem = clickedElem.parentNode;
  if (clickedElem.classList.contains('ditCloseInfo')) {
      hideTeraInfo(clickedElem);
  } else if(parentElem.classList.contains('ditCloseInfo')) {
      hideTeraInfo(parentElem);
  }
});

/* Pkmn info */
/**
 * Returns pokemon name from tera text
 */
function getPkmnName(val, currentUser, showNickname) {
    if(currentUser) {
        let name = beforeMarker(val, ' has Terastallized');
        if(showNickname) {
            return name;
        } else {
            return findRealPkmnName(name, currentUser);
        }
    } else {
        let name = betweenMarkers(val, 'The opposing ', ' has Terastallized');
        if(showNickname) {
            return name;
        } else {
            return findRealPkmnName(name, currentUser);
        }
    }
}

/**
 * Finds real pokemon name starting from its nickname
 */
function findRealPkmnName(name, currentUser) {
    let bar = getUserBar(currentUser);
    // Find the matching span element
    const matchingSpan = document.querySelector(`${bar} .trainer .teamicons span.picon[aria-label^="${name}"]`);

    // Extract the value inside the first brackets or use the name if not found
    let extractedValue = name;
    if (matchingSpan) {
      const ariaLabel = matchingSpan.getAttribute('aria-label');
      const match = ariaLabel.match(/\((.*?)\)/);
      if (match && match[1]) {
          extractedValue = validatePkmnName(match[1], name); // Retrieve the correct name
      }
    }

    // Return the extracted value
    return extractedValue;
}

/**
 * Returns pokemon type from tera text
 */
function getPkmnType(val) {
    return betweenMarkers(val, 'into the ', '-type!');
}

/**
 * Checks if the name found is valid or one of the default strings
 */
function validatePkmnName(match, name) {
  const values = ['active', 'fainted', 'par', 'slp', 'tox', 'psn', 'frz'];
  const isNumberFollowedByPercent = /^(?!([1-9][0-9]?|100)%).*$/;

  if (values.includes(match) || !isNumberFollowedByPercent.test(match)) {
    return name;
  } else {
    return match;
  }
}

/**
 * Returns the html for the tera info
 */
 function getTeraInfo(room, pkmName, pkmType, ditFontSize, ditTextColor, currentUser) {
     return `<div class="ditTeraInfo" style="width: 85px;position: absolute;${getStyleForUser(room, currentUser)};color: ${ditTextColor};text-align: left;font-size: ${ditFontSize}px;line-height: 16px;padding-top: 20px;">
                <div class="ditCloseInfo"><svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 24 24"><path d="M9.03 16.03a.749.749 0 1 1-1.06-1.06l7-7a.749.749 0 1 1 1.06 1.06z"/><path d="M16.03 14.97a.749.749 0 1 1-1.06 1.06l-7-7a.749.749 0 1 1 1.06-1.06z"/><path d="M22.75 5v14A3.75 3.75 0 0 1 19 22.75H5A3.75 3.75 0 0 1 1.25 19V5A3.75 3.75 0 0 1 5 1.25h14A3.75 3.75 0 0 1 22.75 5zm-1.5 0A2.25 2.25 0 0 0 19 2.75H5A2.25 2.25 0 0 0 2.75 5v14A2.25 2.25 0 0 0 5 21.25h14A2.25 2.25 0 0 0 21.25 19z"/></svg></div>
                <span style="word-break: break-all;"><b style="display: block;">Tera:</b>${pkmName}</span>
                <span><b style="display: block;margin-top: 2px;">Type:</b>${pkmType}</span>
            </div>`;
 }

/* CSS utils */
function getTrainerInfoHeight(room, bar) {
    return room.querySelectorAll(`.innerbattle ${bar} .trainer`)[0].offsetHeight;
}
/**
 * Returns styles for the tera info based on user
 */
function getStyleForUser(room, currentUser) {
    if(currentUser) {
        return `left: 11px;bottom: calc(${getTrainerInfoHeight(room, getUserBar(currentUser))}px + 45px)`;
    } else {
        return `right: 2px;top: calc(${getTrainerInfoHeight(room, getUserBar(currentUser))}px + 45px)`;
    }
}

/**
 * Returns correct class for user bar
 */
function getUserBar(currentUser) {
    let bar = '.leftbar';
    if(!currentUser) {
        bar = '.rightbar';
    }
    return bar;
}

/* String utils */
function betweenMarkers(text, begin, end) {
    var firstChar = text.indexOf(begin) + begin.length;
    var lastChar = text.indexOf(end);
    var newText = text.substring(firstChar, lastChar);
    return newText;
}

function beforeMarker(text, end) {
  var index = text.indexOf(end);
  
  if (index !== -1) {
    return text.substring(0, index);
  }
  
  return text; // Return the original string if the search string is not found
}
