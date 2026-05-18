console.log("NoteFlow loaded!");

const fileTypes = ['.pdf', '.docx', '.jpg', '.png', '.pptx'];

function checkForFiles(node) {
  if (!node.innerText) return;
  
  const lines = node.innerText.split('\n');
  lines.forEach(function(line) {
    fileTypes.forEach(function(type) {
      if (line.includes(type)) {
        console.log("File detect hui: " + line.trim());
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