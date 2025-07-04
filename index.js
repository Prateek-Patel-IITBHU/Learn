const repoOwner = "Prateek-Patel-IITBHU";
const repoName = "Learn";
let audio = new Audio();
let songs = [];
let currentIndex = -1;
let currentSong = null;
let voll = 1.0;
let playbarEventsAttached = false;

// Get all MP3 files from the album folder
async function getSongs(folder) {
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${folder}`;
    try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("GitHub API request failed");
        const files = await res.json();
        return files.filter(file => file.name.endsWith(".mp3")).map(file => file.download_url);
    } catch (err) {
        console.error("Error loading songs:", err);
        return [];
    }
}

// Format time in mm:ss
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// Display albums
async function displayAlbums() {
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/music`;
    try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("Failed to fetch albums");
        const folders = await res.json();
        const cardcontainer = document.querySelector(".cardcontainer");
        cardcontainer.innerHTML = "";

        for (let folder of folders) {
            if (folder.type === "dir") {
                try {
                    const infoRes = await fetch(`https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/music/${folder.name}/info.json`);
                    if (!infoRes.ok) continue;
                    const info = await infoRes.json();
                    cardcontainer.innerHTML += `
                        <div class="card">
                            <div class="play" data-folder="${folder.name}">
                                <img src="images/play.svg" alt="play">
                            </div>
                            <img src="https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/music/${folder.name}/cover.jpg" alt="cover">
                            <h2>${info.title}</h2>
                            <p>${info.description}</p>
                        </div>`;
                } catch (err) {
                    console.error("Error loading info for folder:", folder.name, err);
                }
            }
        }

        document.querySelectorAll(".card").forEach(card => {
            card.addEventListener("click", async () => {
                const folder = card.querySelector(".play").dataset.folder;
                if (!folder) return;
                await main(`music/${folder}`);
                if (audio.src === "") {
                    playSongByIndex(0);
                } else {
                    document.querySelector(".left").style.left = "0%";
                }
            });
        });

    } catch (err) {
        console.error("Error displaying albums:", err);
    }
}

// Play selected song
function playSongByIndex(index) {
    if (index < 0 || index >= songs.length) return;

    audio.src = songs[index];
    audio.play();
    audio.volume = voll;
    currentSong = songs[index];
    currentIndex = index;

    document.getElementsByClassName("playbarbutton")[1].src = "images/pause.svg";

    let songName = decodeURIComponent(audio.src)
        .split("/").pop()
        .replaceAll("_", " ")
        .replaceAll("%20", " ")
        .replaceAll("%26", "&")
        .replace(".mp3", "");

    document.querySelector(".songinbar").textContent = songName;
    const timeElement = document.querySelector(".timeinbar");
    const seekSlider = document.querySelector(".range input");

    // Sync seekbar
    audio.ontimeupdate = () => {
        const current = audio.currentTime;
        const total = audio.duration || 1;
        timeElement.innerHTML = `${formatTime(current)} / ${formatTime(total)}`;
        seekSlider.value = (current / total) * 100;
    };

    // Autoplay next
    audio.onended = () => {
        currentIndex = (currentIndex + 1) % songs.length;
        playSongByIndex(currentIndex);
    };
}

// Load songs and set up UI
async function main(folder) {
    songs = await getSongs(folder);
    currentIndex = -1;
    currentSong = null;

    const songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    for (const [index, song] of songs.entries()) {
        let songName = decodeURIComponent(song).split(`/${folder}/`)[1]
            .replaceAll("_", " ")
            .replaceAll("%20", " ")
            .replaceAll("%26", "&");

        songUL.innerHTML += `
            <div class="songButton">
                <div class="musicIcon">
                    <img src="images/music.svg" alt="music" class="invert">
                </div>
                <div class="songInfo">
                    <div class="songName">Song: ${songName}</div>
                    <div class="songArtist">Song Artist: Shreyash Patel</div>
                </div>
                <div class="playNow">Play Now</div>
                <div class="playIcon" data-index="${index}" data-song="${song}">
                    <img src="images/play.svg" alt="Play" class="invert">
                </div>
            </div>`;
    }

    document.querySelectorAll(".playIcon").forEach(icon => {
        icon.addEventListener("click", () => {
            const index = parseInt(icon.dataset.index);
            playSongByIndex(index);
        });
    });

    if (!playbarEventsAttached) {
        // Play/Pause
        document.querySelector(".playbarbutton:nth-child(2)").addEventListener("click", () => {
            if (audio.paused) {
                audio.play();
                document.querySelector(".playbarbutton:nth-child(2)").src = "images/pause.svg";
            } else {
                audio.pause();
                document.querySelector(".playbarbutton:nth-child(2)").src = "images/play.svg";
            }
        });

        // Previous Song
        document.querySelector(".playbarbutton:nth-child(1)").addEventListener("click", () => {
            if (songs.length === 0) return;
            currentIndex = (currentIndex - 1 + songs.length) % songs.length;
            playSongByIndex(currentIndex);
        });

        // Next Song
        document.querySelector(".playbarbutton:nth-child(3)").addEventListener("click", () => {
            if (songs.length === 0) return;
            currentIndex = (currentIndex + 1) % songs.length;
            playSongByIndex(currentIndex);
        });

        // Volume toggle
        document.querySelector(".volbutton").addEventListener("click", e => {
            const img = e.target;
            if (img.src.includes("volume.svg")) {
                img.src = img.src.replace("volume.svg", "mute.svg");
                audio.volume = 0;
            } else {
                img.src = img.src.replace("mute.svg", "volume.svg");
                audio.volume = voll;
            }
        });

        // Volume slider (input)
        document.querySelector(".volumebar input").addEventListener("input", (e) => {
            voll = e.target.value;
            audio.volume = parseFloat(voll) / 100;
            const img = document.querySelector(".volbutton");
            img.src = (audio.volume > 0) ?
                img.src.replace("mute.svg", "volume.svg") :
                img.src.replace("volume.svg", "mute.svg");
        });

        // Seek slider (input)
        document.querySelector(".range input").addEventListener("input", (e) => {
            audio.currentTime = (parseFloat(e.target.value) / 100) * audio.duration;
        });

        // Open/Close side menu
        document.querySelector(".hamburger").addEventListener("click", () => {
            document.querySelector(".left").style.left = "0";
        });

        document.querySelector(".close").addEventListener("click", () => {
            document.querySelector(".left").style.left = "-120%";
        });

        playbarEventsAttached = true;
    }
}

displayAlbums();
