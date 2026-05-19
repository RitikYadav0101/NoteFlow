console.log("NoteFlow loaded!");

const fileTypes = ['.pdf', '.docx', '.jpg', '.png', '.pptx'];
const detectedFiles = new Set();
let isReady = false;

setTimeout(function() {
  isReady = true;
  console.log("NoteFlow ready!");
}, 8000);

function getGroupName() {
  const header = document.querySelector('[data-testid="conversation-header"]');
  if (header) {
    const fullText = header.innerText.split('\n')[0].trim();
    if (fullText.match(/^\+?[\d\s]+$/)) {
      return "General";
    }
    return fullText;
  }
  return "General";
}

function sendGroupName() {
  const groupName = getGroupName();
  fetch('http://localhost:3000/group', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupName: groupName })
  }).catch(function(e) {
    // server nahi chala to ignore karo
  });
}

function tryDownload(node, filename) {
  const downloadBtn = node.querySelector('[aria-label="Download"]') ||
                      node.querySelector('[data-testid*="download"]');
  
  if (downloadBtn) {
    const groupName = getGroupName();
    console.log("Downloading: " + filename + " → NoteFlow/" + groupName + "/");
    downloadBtn.click();
  }
}

function checkForFiles(node) {
  if (!isReady) return;
  if (!node.innerText) return;
  
  const lines = node.innerText.split('\n');
  lines.forEach(function(line) {
    fileTypes.forEach(function(type) {
      if (line.includes(type)) {
        const filename = line.trim();
        if (!detectedFiles.has(filename)) {
          detectedFiles.add(filename);
          console.log("Nai file detect hui: " + filename);
          tryDownload(node, filename);
        }
      }
    });
  });
}

const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    mutation.addedNodes.forEach(function(node) {
      if (node.nodeType === 1) {
        checkForFiles(node);
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

document.addEventListener('click', function() {
  setTimeout(sendGroupName, 1000);
});

setTimeout(sendGroupName, 3000);

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === "GET_GROUP_NAME") {
    sendResponse({groupName: getGroupName()});
  }
  return true;
});