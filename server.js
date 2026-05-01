const http = require('http');
const fs = require('fs');
const path = require('path');
const {getHtml, getHome,  getPeoplesJson, getPeoples, postPeopleForm, postPeopleJson, getImg, getMp3, getVideo, notFound} = require('./functions.js')

const mime = require('mime-types');

const server = http.createServer((req, res) => {
    //Раздача статики из папки media:
    if (req.method === 'GET' && req.url.startsWith('/media')) {
        const filePath = path.join(__dirname, 'media', req.url.replace('/media', ''));
        fs.readFile(filePath, (err, data) => {
            if (err) {
                notFound(req, res);
                return;
            }
            const mimeType = mime.lookup(filePath) || 'application/octet-stream';
            res.writeHead(200, {'Content-Type': mimeType});
            res.end(data);
        });
        return;
    }

    if (req.method === 'GET' && req.url === '/') {
        getHome(req, res);
        return
    }
    if (req.method === 'GET' && req.url === '/html') {
        getHtml(req, res);
        return
    }
    if (req.method === 'GET' && req.url === '/peoples') {
        getPeoples(req, res);
        return;
    }
    if (req.method === 'GET' && req.url === '/peoplesJson') {
        getPeoplesJson(req, res);
        return;
    }
    if (req.method === 'POST' && req.url === '/peoplesJson') {
        postPeopleJson(req, res);
        return;
    }
    if (req.method === 'POST' && req.url === '/peoplesForm') {
        postPeopleForm(req, res);
        return;
    }
    if (req.method === 'GET' && req.url === '/img') {
        getImg(req, res)
        return;
    }
    if (req.method === 'GET' && req.url === '/mp3') {
        getMp3(req, res);
        return;
    }
    if (req.url === '/video') {
        getVideo(req, res)
        return;
    }
    notFound(req, res)
});

server.listen(2000, () => {
    console.log('Сервер запущен на порту 2000');
});
