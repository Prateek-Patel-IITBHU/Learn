const repoOwner = "Prateek-Patel-IITBHU";
const repoName = "Learn";

// Get all MP3 files from the album folder
async function getSongs(folder) {
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${folder}`;

    try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("GitHub API request failed");
        const files = await res.json();

        return files
            .filter(file => file.name.endsWith(".mp3"))
            .map(file => file.download_url);
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

let audio = new Audio();
let songs = [];
let currentIndex = -1;
let currentSong = null;
let voll = 1.0;
let playbarEventsAttached = false;

// Show album cards
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
                const folderName = folder.name;

                try {
                    const infoRes = await fetch(`https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/music/${folderName}/info.json`);
                    if (!infoRes.ok) continue;

                    const info = await infoRes.json();
                    cardcontainer.innerHTML += `
                        <div class="card">
                            <div class="play" data-folder="${folderName}">
                                <img src="images/play.svg" alt="play">
                            </div>
                            <img src="https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/music/${folderName}/cover.jpg" alt="cover">
                            <h2>${info.title}</h2>
                            <p>${info.description}</p>
                        </div>
                    `;
                } catch (err) {
                    console.error("Error loading info for folder:", folderName, err);
                }
            }
        }

        // Album click -> load songs
        Array.from(document.getElementsByClassName("card")).forEach(card => {
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
    const circle = document.querySelector(".circle");
    const seekBar = document.querySelector(".seekBar");

    audio.ontimeupdate = () => {
        const currentSeconds = audio.currentTime;
        const totalSeconds = audio.duration || 1;
        timeElement.innerHTML = `${formatTime(currentSeconds)} / ${formatTime(totalSeconds)}`;
        const barWidth = seekBar.offsetWidth;
        const leftPosition = (currentSeconds / totalSeconds) * (barWidth - circle.offsetWidth);
        circle.style.left = `${leftPosition}px`;
    };
}

// Load songs and create UI
async function main(folder) {
    songs = await getSongs(folder);
    currentIndex = -1;
    currentSong = null;

    const songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    for (const [index, song] of songs.entries()) {
        let songName = decodeURIComponent(song).split("/").pop()
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
            </div>
        `;
    }

    document.querySelectorAll(".playIcon").forEach(icon => {
        icon.addEventListener("click", () => {
            const index = parseInt(icon.dataset.index);
            playSongByIndex(index);
        });
    });

    if (!playbarEventsAttached) {
        document.getElementsByClassName("playbarbutton")[1].addEventListener("click", () => {
            if (audio.paused) {
                audio.play();
                document.getElementsByClassName("playbarbutton")[1].src = "images/pause.svg";
            } else {
                audio.pause();
                document.getElementsByClassName("playbarbutton")[1].src = "images/play.svg";
            }
        });

        document.getElementsByClassName("playbarbutton")[0].addEventListener("click", () => {
            if (songs.length === 0) return;
            currentIndex = (currentIndex - 1 + songs.length) % songs.length;
            playSongByIndex(currentIndex);
        });

        document.getElementsByClassName("playbarbutton")[2].addEventListener("click", () => {
            if (songs.length === 0) return;
            currentIndex = (currentIndex + 1) % songs.length;
            playSongByIndex(currentIndex);
        });

        document.querySelector(".volbutton").addEventListener("click", e => {
            if (e.target.src.includes("volume.svg")) {
                e.target.src = e.target.src.replace("volume.svg", "mute.svg");
                audio.volume = 0;
            } else {
                e.target.src = e.target.src.replace("mute.svg", "volume.svg");
                audio.volume = voll;
            }
        });

        document.querySelector(".volumebar").addEventListener("click", e => {
            document.querySelector(".vol").style.left = (e.offsetX / e.target.getBoundingClientRect().width) * 100 + `%`;
            voll = e.offsetX / e.target.getBoundingClientRect().width;
            audio.volume = voll;
        });

        document.querySelector(".seekBar").addEventListener("click", e => {
            document.querySelector(".circle").style.left = (e.offsetX / e.target.getBoundingClientRect().width) * 100 + `%`;
            audio.currentTime = (e.offsetX / e.target.getBoundingClientRect().width) * audio.duration;
        });

        document.querySelector(".hamburger").addEventListener("click", () => {
            document.querySelector(".left").style.left = "0";
        });

        document.querySelector(".close").addEventListener("click", () => {
            document.querySelector(".left").style.left = "-120%";
        });

        playbarEventsAttached = true;
    }
}

// Initialize
displayAlbums();
