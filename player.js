
const video = document.getElementById("video");
const angleSlider = document.getElementById("angle");
const angleValue = document.getElementById("angleValue");
const placeholder = document.getElementById("placeholder");
const status = document.getElementById("status");
const fitButton = document.getElementById("fitButton");

let currentAngle = 0;
let audioContext = null;
let audioSource = null;

function rotateVideo(angle) {
  currentAngle = Number(angle);
  angleValue.textContent = `${currentAngle}°`;
  angleSlider.value = currentAngle;
  video.style.transform = `rotate(${currentAngle}deg)`;
}

angleSlider.addEventListener("input", () => {
  rotateVideo(angleSlider.value);
});

document.querySelectorAll("[data-angle]").forEach((button) => {
  button.addEventListener("click", () => {
    rotateVideo(button.dataset.angle);
  });
});

fitButton.addEventListener("click", () => {
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.objectFit = "contain";
  rotateVideo(currentAngle);
  status.textContent = "Fit applied";
});

async function startStream(streamId) {
  try {
    status.textContent = "Connecting to video…";

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId
        }
      },
      video: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId
        }
      }
    });

    video.srcObject = stream;
    video.muted = true;

    // Route captured tab audio to the player window's speakers.
    const audioTracks = stream.getAudioTracks();

    if (audioTracks.length > 0) {
      audioContext = new AudioContext();
      audioSource = audioContext.createMediaStreamSource(
        new MediaStream(audioTracks)
      );
      audioSource.connect(audioContext.destination);

      try {
        await audioContext.resume();
      } catch (error) {
        console.warn("Audio needs user interaction:", error);
      }
    }

    await video.play();

    placeholder.style.display = "none";
    video.style.display = "block";
    status.textContent = "Live tab capture connected";

    stream.getVideoTracks()[0]?.addEventListener("ended", () => {
      status.textContent = "Capture ended";
    });
  } catch (error) {
    console.error("RotateX stream error:", error);
status.textContent = `Capture failed: ${error.name}`;
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "ROTATEX_START_STREAM" && message.streamId) {
    startStream(message.streamId);
  }
});

video.addEventListener("error", () => {
  status.textContent = "Video playback error";
});

rotateVideo(0);


