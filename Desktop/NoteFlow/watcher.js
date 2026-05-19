const fs = require('fs');
const path = require('path');
const os = require('os');

const watchPath = path.join(os.homedir(), 'Desktop', 'NoteFlow', 'Downloads');
const noteflowPath = path.join(os.homedir(), 'Desktop', 'NoteFlow');
const fileTypes = ['.pdf', '.docx', '.jpg', '.png', '.pptx'];

if (!fs.existsSync(watchPath)) {
  fs.mkdirSync(watchPath, { recursive: true });
}

console.log("NoteFlow Watcher chalu ho gaya!");
console.log("Watch kar raha hoon:", watchPath);

fs.watch(watchPath, function(event, filename) {
  if (!filename) return;
  
  const ext = path.extname(filename).toLowerCase();
  if (!fileTypes.includes(ext)) return;
  
  const sourcePath = path.join(watchPath, filename);
  
  setTimeout(function() {
    try {
      if (fs.existsSync(sourcePath)) {
        const targetDir = path.join(noteflowPath, 'General');
        const targetPath = path.join(targetDir, filename);
        
        console.log("Source:", sourcePath);
        console.log("Target:", targetPath);
        
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
          console.log("Folder banaya:", targetDir);
        }
        
        fs.copyFileSync(sourcePath, targetPath);
        fs.unlinkSync(sourcePath);
        console.log("File move hui: " + filename + " → NoteFlow/General/");
      } else {
        console.log("File nahi mili:", sourcePath);
      }
    } catch(err) {
      console.log("Error:", err.message);
    }
  }, 3000);
});