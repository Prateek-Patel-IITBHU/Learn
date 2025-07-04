async function getSongs(folder) {
    try {
        const res = await fetch(`./${folder}/`);
        const text = await res.text();
        const div = document.createElement("div");
        div.innerHTML = text;
        const anchors = div.getElementsByTagName("a");

        const songs = [];
        for (let a of anchors) {
            const href = a.getAttribute("href");
            if (href && href.endsWith(".mp3")) {
                songs.push(`${folder}/${href}`);
            }
        }

        return songs;
    } catch (err) {
        console.error("Failed to load songs from folder:", folder, err);
        return [];
    }
}

// ⏯ Rest of your original unchanged code starts here

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
    audio.ontimeupdate = () => {
        const currentSeconds = audio.currentTime;
        const totalSeconds = audio.duration || 1;
        timeElement.innerHTML = `${formatTime(currentSeconds)} / ${formatTime(totalSeconds)}`;
        document.querySelector(".slider").value = (currentSeconds / totalSeconds) * 100;
    };
}

async function main(folder) {
    songs = await getSongs(folder);
    currentIndex = -1;
    currentSong = null;

    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
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

        document.querySelector(".volumebar").getElementsByTagName("input")[0].addEventListener("change", (e) => {
            voll = e.target.value;
            audio.volume = parseInt(e.target.value) / 100;
            if (audio.volume > 0) {
                document.querySelector(".volbutton").src = document.querySelector(".volbutton").src.replace("mute.svg", "volume.svg");
            } else {
                document.querySelector(".volbutton").src = document.querySelector(".volbutton").src.replace("volume.svg", "mute.svg");
            }
        });

        document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
            audio.currentTime = parseInt(e.target.value) * audio.duration / 100;
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

displayAlbums();
