async function getSongs(folder) {
    let a = await fetch(`./${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let songs = [];
    for (let index = 0; index < as.length; index++) {
        const Element = as[index];
        if (Element.href.endsWith(".mp3")) {
            songs.push(Element.href);
        }
    }
    return songs;
}

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

async function displayAlbums() {
    let a = await fetch(`./music/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;

    let anchors = div.getElementsByTagName("a");
    let cardcontainer = document.querySelector(".cardcontainer");
    cardcontainer.innerHTML = "";

    let array = Array.from(anchors);
    for (let e of array) {
        if (e.href.includes("/music/")) {
            let folder = e.href.split("/").slice(-1)[0].replaceAll("%20", " ");
            try {
                let res = await fetch(`./music/${folder}/info.json`);
                if (!res.ok) continue;
                let info = await res.json();

                cardcontainer.innerHTML += `
                    <div class="card">
                        <div class="play" data-folder="${folder}">
                            <img src="images/play.svg" alt="play">
                        </div>
                        <img src="music/${folder}/cover.jpg" alt="s1">
                        <h2>${info.title}</h2>
                        <p>${info.description}</p>
                    </div>
                `;
            } catch (err) {
                console.error(`Error with folder "${folder}":`, err);
            }
        }
    }

    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async (event) => {
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
}

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
                audio.volume = voll;
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

displayAlbums();
