const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const config = require('./config');

const watchPath = path.join(os.homedir(), 'Desktop', 'NoteFlow', 'Downloads');
const subjectsPath = path.join(os.homedir(), 'Desktop', 'NoteFlow', 'subjects');
const movedFiles = new Set();

let currentGroup = "Unsorted";

if (!fs.existsSync(watchPath)) {
  fs.mkdirSync(watchPath, { recursive: true });
}

if (!fs.existsSync(subjectsPath)) {
  fs.mkdirSync(subjectsPath, { recursive: true });
}

async function classifyFile(filename, groupName) {
  if (config.GROUP_MAPPING[groupName]) {
    console.log("Group mapping mila:", config.GROUP_MAPPING[groupName]);
    return config.GROUP_MAPPING[groupName];
  }

  // Keyword check pehle
  if (config.SUBJECT_KEYWORDS) {
    for (const [subject, keywords] of Object.entries(config.SUBJECT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (filename.toLowerCase().includes(keyword.toLowerCase())) {
          console.log("Keyword match mila:", subject);
          return subject;
        }
      }
    }
  }

  try {
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    
    const prompt = `File naam: "${filename}", Group: "${groupName}". Subjects: ${config.SUBJECTS.join(', ')}. Sirf subject naam likho. Agar match nahi mila toh "Unsorted" likho.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${config.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const subject = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Unsorted";
    console.log("Gemini ne classify kiya:", subject);
    return subject;

  } catch(err) {
    console.log("Gemini error:", err.message);
    return "Unsorted";
  }
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
        currentGroup = data.groupName || "Unsorted";
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

fs.watch(watchPath, async function(event, filename) {
  if (!filename) return;
  
  const ext = path.extname(filename).toLowerCase();
  const fileTypes = ['.pdf', '.docx', '.jpg', '.png', '.pptx'];
  if (!fileTypes.includes(ext)) return;
  
  const baseFilename = filename.split('(')[0].trim();
  
  if (movedFiles.has(baseFilename)) {
    console.log("Duplicate skip:", filename);
    return;
  }
  
  movedFiles.add(baseFilename);
  
  const sourcePath = path.join(watchPath, filename);
  
  setTimeout(async function() {
    try {
      if (!fs.existsSync(sourcePath)) return;
      
      const subject = await classifyFile(filename, currentGroup);
      
      const targetDir = path.join(subjectsPath, subject);
      const targetPath = path.join(targetDir, filename);
      
      if (fs.existsSync(targetPath)) {
        console.log("File already exists:", filename);
        if (fs.existsSync(sourcePath)) {
          fs.unlinkSync(sourcePath);
        }
        return;
      }
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      fs.copyFileSync(sourcePath, targetPath);
      fs.unlinkSync(sourcePath);
      console.log("File save hui: " + filename + " → subjects/" + subject + "/");
      
    } catch(err) {
      console.log("Error:", err.message);
    }
  }, 5000);
});

console.log("NoteFlow Watcher chalu ho gaya!");
console.log("Watch kar raha hoon:", watchPath);