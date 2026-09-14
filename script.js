const audio = document.getElementById('audio');
const fileInput = document.getElementById('file-input');
const songNameEl = document.getElementById('song-name');
const artistEl = document.getElementById('artist');
const albumArtEl = document.getElementById('album-art');

const menuBtn = document.getElementById('menu-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const playPauseBtn = document.getElementById('play-pause-btn');
const centerBtn = document.getElementById('center-btn');
const closeBtn = document.getElementById('close-btn');

const progressBar = document.getElementById('progress-bar');
const progressFill = document.getElementById('progress-fill');
const playIcon = document.getElementById('play-icon');

let playlist = [];
let currentTrackIndex = 0;
let isDragging = false;
let wasPlayingBeforeDrag = false;

// Open folder picker
menuBtn.addEventListener('click', () => fileInput.click());
centerBtn.addEventListener('click', () => fileInput.click());

// Close app
closeBtn.addEventListener('click', () => window.close());

// Handle file selection
fileInput.addEventListener('change', (event) => {
    const allFiles = Array.from(event.target.files);

    // Accept audio files. Note: .webm is often reported as video/webm,
    // so we check both the MIME type and the file extension.
    const audioFiles = allFiles.filter(file => {
        const name = file.name.toLowerCase();
        return (
            file.type.startsWith('audio/') ||
            file.type.startsWith('video/') ||
            name.endsWith('.mp3') ||
            name.endsWith('.wav') ||
            name.endsWith('.ogg') ||
            name.endsWith('.m4a') ||
            name.endsWith('.flac') ||
            name.endsWith('.webm') ||
            name.endsWith('.opus') ||
            name.endsWith('.aac')
        );
    });

    const imageFiles = allFiles.filter(file =>
        file.type.startsWith('image/') ||
        /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name)
    );

    if (audioFiles.length === 0) {
        alert('No audio files found in that folder!');
        return;
    }

    function findAlbumArt(audioName) {
        const cleanAudioName = audioName.replace(/\.[^/.]+$/, "").toLowerCase();

        // 1. Image named exactly like the song ("Song.mp3" -> "Song.jpg")
        let match = imageFiles.find(img =>
            img.name.toLowerCase().replace(/\.[^/.]+$/, "") === cleanAudioName
        );
        if (match) return URL.createObjectURL(match);

        // 2. Common album art filenames (cover.jpg, folder.png, etc.)
        match = imageFiles.find(img =>
            /^(cover|folder|album|front|artwork)\.(jpg|jpeg|png|webp)$/i.test(img.name)
        );
        if (match) return URL.createObjectURL(match);

        return null;
    }

    playlist = audioFiles.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
        artUrl: findAlbumArt(file.name)
    }));

    currentTrackIndex = 0;
    loadTrack(currentTrackIndex);
    audio.play();
});

// Load a track
function loadTrack(index) {
    const track = playlist[index];
    audio.src = track.url;

    if (track.artUrl) {
        albumArtEl.src = track.artUrl;
        albumArtEl.style.display = 'block';
    } else {
        albumArtEl.src = '';
        albumArtEl.style.display = 'none';
    }

    // Parse "Artist - Song.mp3" or "Song.mp3"
    const cleanName = track.name.replace(/\.[^/.]+$/, "");
    const parts = cleanName.split(' - ');

    if (parts.length >= 2) {
        artistEl.textContent = parts[0].trim();
        songNameEl.textContent = parts.slice(1).join(' - ').trim();
    } else {
        artistEl.textContent = 'Unknown Artist';
        songNameEl.textContent = cleanName;
    }
}

// Play / Pause
function togglePlayPause() {
    if (!audio.src) {
        fileInput.click();
        return;
    }
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
}

playPauseBtn.addEventListener('click', (event) => {
    togglePlayPause();
    event.currentTarget.blur();
});

audio.addEventListener('play', () => {
    playIcon.textContent = '❚❚';
});

audio.addEventListener('pause', () => {
    playIcon.textContent = '▶';
});

// Next / Previous
function nextTrack() {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
    audio.play();
}

function prevTrack() {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
    audio.play();
}

nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);

audio.addEventListener('ended', nextTrack);

// Progress bar with drag-to-seek
function seekToPosition(event) {
    if (!audio.duration) return;

    const rect = progressBar.getBoundingClientRect();
    let clickX = event.clientX - rect.left;
    clickX = Math.max(0, Math.min(clickX, rect.width));

    const percent = clickX / rect.width;
    audio.currentTime = percent * audio.duration;
    progressFill.style.width = (percent * 100) + '%';
}

progressBar.addEventListener('mousedown', (event) => {
    isDragging = true;
    wasPlayingBeforeDrag = !audio.paused;
    if (wasPlayingBeforeDrag) audio.pause();
    seekToPosition(event);
});

document.addEventListener('mousemove', (event) => {
    if (isDragging) seekToPosition(event);
});

document.addEventListener('mouseup', () => {
    if (isDragging && wasPlayingBeforeDrag) audio.play();
    isDragging = false;
});

audio.addEventListener('timeupdate', () => {
    if (!audio.duration || isDragging) return;
    const percent = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = percent + '%';
});

audio.addEventListener('loadedmetadata', () => {
    progressFill.style.width = '0%';
});

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

    switch (event.code) {
        case 'Space':
            event.preventDefault();
            togglePlayPause();
            break;

        case 'ArrowRight':
            event.preventDefault();
            if (audio.duration) {
                audio.currentTime = Math.min(audio.currentTime + 5, audio.duration);
            }
            break;

        case 'ArrowLeft':
            event.preventDefault();
            audio.currentTime = Math.max(audio.currentTime - 5, 0);
            break;

        case 'ArrowUp':
            event.preventDefault();
            audio.volume = Math.min(audio.volume + 0.1, 1);
            break;

        case 'ArrowDown':
            event.preventDefault();
            audio.volume = Math.max(audio.volume - 0.1, 0);
            break;

        case 'KeyN':
            nextTrack();
            break;

        case 'KeyP':
            prevTrack();
            break;
    }
});