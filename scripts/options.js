// Saves options to chrome.storage
function save_options() {
  var fontSize = document.getElementById('ditFontSize').value;
  var textColor = document.getElementById('ditTextColor').value;
  chrome.storage.sync.set({
    ditFontSize: fontSize,
    ditTextColor: textColor
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
    ditTextColor: '#000000'
  }, function(items) {
    document.getElementById('ditFontSize').value = items.ditFontSize;
    document.getElementById('ditTextColor').value = items.ditTextColor;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);