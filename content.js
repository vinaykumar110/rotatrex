
(() => {
  if (globalThis.rotateXInstalled) {
    return;
  }

  globalThis.rotateXInstalled = true;

  const page = document.documentElement;

  const originalPageTransform = page.style.transform;
  const originalPageOrigin = page.style.transformOrigin;

  let activeVideo = null;
  let originalVideoStyle = null;

  function restorePage() {
    page.style.transform = originalPageTransform;
    page.style.transformOrigin = originalPageOrigin;
  }

  function restoreVideo() {
    if (!activeVideo) return;

    if (originalVideoStyle === null) {
      activeVideo.removeAttribute("style");
    } else {
      activeVideo.setAttribute("style", originalVideoStyle);
    }

    activeVideo = null;
    originalVideoStyle = null;
  }

  function findBestVideo() {
    const videos = Array.from(document.querySelectorAll("video"));

    const candidates = videos.filter((video) => {
      const rect = video.getBoundingClientRect();
      const style = getComputedStyle(video);

      return (
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden"
      );
    });

    candidates.sort((a, b) => {
      const score = (video) => {
        const rect = video.getBoundingClientRect();
        const area = rect.width * rect.height;
        return area * (video.paused ? 1 : 3);
      };

      return score(b) - score(a);
    });

    return candidates[0] || null;
  }

  function rotateVideo(angle) {
    restorePage();

    if (angle === 0) {
      restoreVideo();
      return;
    }

    const video = findBestVideo();

    if (!video) {
      restoreVideo();
      console.warn("RotateX: No visible video was found.");
      return;
    }

    if (activeVideo !== video) {
      restoreVideo();

      activeVideo = video;
      originalVideoStyle = video.getAttribute("style");
    }

    const ratio = video.videoWidth / video.videoHeight;
    const radians = (angle * Math.PI) / 180;

    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));

    
const margin = 24;

const viewportWidth = Math.max(0, window.innerWidth - margin * 2);
const viewportHeight = Math.max(0, window.innerHeight - margin * 2);

// Calculate the largest video width that fits
// after rotation, leaving space around the edges.
const width = Math.min(
  viewportWidth / (cos + sin / ratio),
  viewportHeight / (sin + cos / ratio)
);


    const setStyle = (property, value) => {
      video.style.setProperty(property, value, "important");
    };

    setStyle("position", "fixed");
    setStyle("top", "50%");
    setStyle("left", "50%");
    setStyle("right", "auto");
    setStyle("bottom", "auto");
    setStyle("width", `${Math.floor(width)}px`);
    setStyle("height", "auto");
    setStyle("max-width", "none");
    setStyle("max-height", "none");
    setStyle("margin", "0");
    setStyle("object-fit", "contain");
    setStyle("transform-origin", "center center");
    setStyle(
      "transform",
      `translate(-50%, -50%) rotate(${angle}deg)`
    );
    setStyle("z-index", "2147483647");
    setStyle("background", "#000");
  }

  function applyRotation(message) {
    const angle = Math.max(0, Math.min(360, Number(message.angle) || 0));

    if (message.mode === "page") {
      restoreVideo();

      if (angle === 0) {
        restorePage();
      } else {
        page.style.transformOrigin = "center center";
        page.style.transform = `rotate(${angle}deg)`;
      }
    }

    if (message.mode === "video") {
      rotateVideo(angle);
    }
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "ROTATEX_UPDATE") {
      applyRotation(message);
    }

    if (message.type === "ROTATEX_RESET") {
      restoreVideo();
      restorePage();
    }
    
if (message.type === "ROTATEX_PIP") {
  const video = findBestVideo();

  if (!video) {
    console.warn("RotateX: No visible video was found.");
    return;
  }

  video.requestPictureInPicture().catch((error) => {
    console.error("RotateX: Could not open Picture-in-Picture.", error);
  });
}

  });
})();
