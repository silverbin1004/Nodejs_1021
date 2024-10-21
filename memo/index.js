const http = require('http');
const url = require('url');
const fs = require('fs');

const PORT = 1000;
let notes = [];

// 데이터 파일 로드
if (fs.existsSync('notes.json')) {
    const data = fs.readFileSync('notes.json');
    notes = JSON.parse(data);
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;

    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

  if(pathname === '/notes'){
    if (req.method === 'GET') {
      const search = query.search ? query.search.toLowerCase() : null;
      let filteredNotes = notes;
      
      if (search) {
          filteredNotes = notes.filter(note =>
              note.title.toLowerCase().includes(search) ||
              note.content.toLowerCase().includes(search)
          );
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(filteredNotes));
    } else if(req.method === 'POST'){
      let body = '';

      req.on('data', chunk => {body += chunk;});
      req.on('end', () => {
        const {title, content} = JSON.parse(body);
        const newNote = {
          id: Date.now(),
          title, 
          content,
          createAt: new Date()
        };
        notes.push(newNote);
        fs.writeFileSync('notes.json', JSON.stringify(notes));
        res.writeHead(201, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(newNote));
      });
    }
  } else if(pathname.startsWith('/notes/')){
    const id = parseInt(pathname.split('/')[2]);
    const noteIndex = notes.findIndex(n => n.id === id);
    if(noteIndex === -1){
      res.writeHead(404, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({message: 'Note not found'}));
      return;
    }
    if(req.method === 'GET'){
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(notes[noteIndex]));
    } else if(req.method === 'PUT'){
      let body = '';

      req.on('data', chunk => {body += chunk;});
      req.on('end', () => {
        const{title, content} = JSON.parse(body);
        notes[noteIndex] = {...notes[noteIndex], title, content};
        fs.writeFileSync('notes.json', JSON.stringify(notes));
        res.writeHead(200, {'Content-type': 'application'});
        res.end(JSON.stringify(notes[noteIndex]));
      });
    } else if(req.method === 'DELETE'){
      notes.splice(noteIndex,1);
      fs.writeFileSync('notes.json', JSON.stringify(notes));
      res.writeHead(204);
      res.end();
    }
  } else{
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({message: 'Not Found'}));
  }
});

server.listen(PORT, ()=>{
  console.log(`노트 관리 API가 http://localhost${PORT} 에서 실행 중입니다.`);
});