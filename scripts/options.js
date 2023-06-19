// Saves options to chrome.storage
function save_options() {
  var fontSize = document.getElementById('ditFontSize').value;
  var textColor = document.getElementById('ditTextColor').value;
  var showNicknames = document.getElementById('ditShowNicknames').checked;
  var showBothUserTera = document.getElementById('ditShowBothUserTera').checked;
  chrome.storage.sync.set({
    ditFontSize: fontSize,
    ditTextColor: textColor,
    ditShowNicknames: showNicknames,
    ditShowBothUserTera: showBothUserTera,
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores inputs state using the preferences stored in chrome.storage
function restore_options() {
  chrome.storage.sync.get({
    ditFontSize: 11,
    ditTextColor: '#000000',
    ditShowNicknames: false,
    ditShowBothUserTera: false,
  }, function(items) {
    document.getElementById('ditFontSize').value = items.ditFontSize;
    document.getElementById('ditTextColor').value = items.ditTextColor;
    document.getElementById('ditShowNicknames').checked = items.ditShowNicknames;
    document.getElementById('ditShowBothUserTera').checked = items.ditShowBothUserTera;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);