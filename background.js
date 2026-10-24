
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "ROTATEX_OPEN_PLAYER") {
    openPlayerWindow(message.tabId);
  }
});


async function openPlayerWindow(tabId) {
  try {
    if (tabId === undefined) {
      throw new Error("Could not identify the active tab.");
    }

    // 1. Open the player window.
    const playerWindow = await chrome.windows.create({
      url: chrome.runtime.getURL("player.html"),
      type: "popup",
      width: 520,
      height: 620
    });

    const playerTabs = await chrome.tabs.query({
      windowId: playerWindow.id
    });

    const playerTab = playerTabs[0];

    if (playerTab?.id === undefined) {
      throw new Error("Could not find the player tab.");
    }

    // 2. Wait until the player page has loaded.
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        reject(new Error("Timed out waiting for the player."));
      }, 10000);

      function listener(updatedTabId, changeInfo) {
        if (
          updatedTabId === playerTab.id &&
          changeInfo.status === "complete"
        ) {
          clearTimeout(timeout);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      }

      chrome.tabs.onUpdated.addListener(listener);
    });

    // 3. Create a fresh stream ID after the player is ready.
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tabId,
      consumerTabId: playerTab.id
    });

    // 4. Send the stream ID to the ready player.
    await chrome.tabs.sendMessage(playerTab.id, {
      type: "ROTATEX_START_STREAM",
      streamId
    });

  } catch (error) {
    console.error("RotateX capture error:", error);
  }
}

