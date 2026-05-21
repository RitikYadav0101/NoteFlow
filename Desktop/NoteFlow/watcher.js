const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

const watchPath = path.join(os.homedir(), 'Desktop', 'NoteFlow', 'Downloads');
const noteflowPath = path.join(os.homedir(), 'Desktop', 'NoteFlow');
const fileTypes = ['.pdf', '.docx', '.jpg', '.png', '.pptx'];
const movedFiles = new Set();

let currentGroup = "General";

if (!fs.existsSync(watchPath)) {
  fs.mkdirSync(watchPath, { recursive: true });
}

const server = http.createServer(function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method === 'POST' && req.url === '/group') {
    let body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
      try {
        const data = JSON.parse(body);
        currentGroup = data.groupName || "General";
        console.log("Group updated:", currentGroup);
        res.writeHead(200);
        res.end('OK');
      } catch(e) {
        res.writeHead(400);
        res.end('Error');
      }
    });
  }
});

server.listen(3000, function() {
  console.log("NoteFlow server chalu ho gaya — port 3000");
});

fs.watch(watchPath, function(event, filename) {
  if (!filename) return;
  
  const ext = path.extname(filename).toLowerCase();
  if (!fileTypes.includes(ext)) return;
  
  const sourcePath = path.join(watchPath, filename);
  const baseFilename = filename.split('(')[0].trim();
  
  setTimeout(function() {
    try {
      if (!fs.existsSync(sourcePath)) return;
      
      if (movedFiles.has(baseFilename)) {
        console.log("Duplicate skip:", filename);
        fs.unlinkSync(sourcePath);
        return;
      }
      
      movedFiles.add(baseFilename);
      
      const targetDir = path.join(noteflowPath, currentGroup);
      const targetPath = path.join(targetDir, filename);
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      fs.copyFileSync(sourcePath, targetPath);
      fs.unlinkSync(sourcePath);
      console.log("File move hui: " + filename + " → NoteFlow/" + currentGroup + "/");
      
    } catch(err) {
      console.log("Error:", err.message);
    }
  }, 3000);
});

console.log("NoteFlow Watcher chalu ho gaya!");
console.log("Watch kar raha hoon:", watchPath);