
const angleSlider = document.getElementById("angle");
const angleValue = document.getElementById("angleValue");
const modeSelect = document.getElementById("mode");
const resetButton = document.getElementById("reset");
const floatPlayerButton = document.getElementById("floatPlayer");

// Find the currently active Chrome tab.
async function getActiveTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tabs[0];
}

// Inject content.js before sending it any messages.
async function preparePage() {
  const tab = await getActiveTab();

  if (!tab || tab.id === undefined) {
    throw new Error("No active tab found.");
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });

  return tab;
}

// Send the current rotation settings to the webpage.
async function applyRotation() {
  try {
    const tab = await preparePage();

    await chrome.tabs.sendMessage(tab.id, {
      type: "ROTATEX_UPDATE",
      mode: modeSelect.value,
      angle: Number(angleSlider.value)
    });
  } catch (error) {
    console.error("RotateX could not rotate this tab:", error);
  }
}

// Update the displayed angle and apply rotation.
angleSlider.addEventListener("input", () => {
  angleValue.textContent = `${angleSlider.value}°`;
  applyRotation();
});

// Apply the selected mode at the current angle.
modeSelect.addEventListener("change", () => {
  applyRotation();
});

// Reset the webpage and popup controls.
resetButton.addEventListener("click", async () => {
  angleSlider.value = 0;
  angleValue.textContent = "0°";

  try {
    const tab = await preparePage();

    await chrome.tabs.sendMessage(tab.id, {
      type: "ROTATEX_RESET"
    });
  } catch (error) {
    console.error("RotateX could not reset this tab:", error);
  }
});

// Request the floating player.


floatPlayerButton.addEventListener("click", async () => {
  try {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    const tab = tabs[0];

    if (!tab || tab.id === undefined) {
      throw new Error("No active tab found.");
    }

    await chrome.runtime.sendMessage({
      type: "ROTATEX_OPEN_PLAYER",
      tabId: tab.id
    });
  } catch (error) {
    console.error("RotateX player error:", error);
  }
});

