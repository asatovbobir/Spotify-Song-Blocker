document.addEventListener('DOMContentLoaded', function() {
  const songInput = document.getElementById('songInput');
  const addButton = document.getElementById('addButton');
  const blockedSongsList = document.getElementById('blockedSongsList');

  // Load and display blocked songs when popup opens
  loadBlockedSongs();

  addButton.addEventListener('click', function() {
    const songName = songInput.value.trim();
    if (songName) {
      chrome.storage.sync.get(['blockedSongs'], function(result) {
        const blockedSongs = result.blockedSongs || [];
        if (!blockedSongs.includes(songName)) {
          blockedSongs.push(songName);
          chrome.storage.sync.set({ blockedSongs: blockedSongs }, function() {
            loadBlockedSongs();
            songInput.value = '';
          });
        }
      });
    }
  });

  function loadBlockedSongs() {
    chrome.storage.sync.get(['blockedSongs'], function(result) {
      const blockedSongs = result.blockedSongs || [];
      blockedSongsList.innerHTML = '';
      
      blockedSongs.forEach(function(song) {
        const songElement = document.createElement('div');
        songElement.className = 'song-item';
        songElement.innerHTML = `
          <span>${song}</span>
          <button class="remove-btn" data-song="${song}">Remove</button>
        `;
        blockedSongsList.appendChild(songElement);
      });

      // Add remove button listeners
      document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', function() {
          const songToRemove = this.getAttribute('data-song');
          removeBlockedSong(songToRemove);
        });
      });
    });
  }

  function removeBlockedSong(songName) {
    chrome.storage.sync.get(['blockedSongs'], function(result) {
      const blockedSongs = result.blockedSongs || [];
      const updatedSongs = blockedSongs.filter(song => song !== songName);
      chrome.storage.sync.set({ blockedSongs: updatedSongs }, function() {
        loadBlockedSongs();
      });
    });
  }
});

