const path = require('path');
const fs = require('fs');
const querystring = require('querystring');
const {dataJson} = require('./media/dataJson');

const https = require('https');


function getHome(req, res) {
    const filePath = path.join(__dirname, './media/home.html');
    fs.readFile(filePath, 'utf8', (err, htmlTemplate) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('Файл не найден');
        }
        // Генерируем список имён
        const namesList = dataJson.map(person => `<li>${person.name}</li>`).join('');
        // Вычисляем средний возраст
        const avgAge = (dataJson.reduce((sum, p) => sum + p.age, 0) / dataJson.length).toFixed(1);
        // Вставляем в шаблон
        const renderedHtml = htmlTemplate
            .replace('<!--NAMES_PLACEHOLDER-->', `<ul>${namesList}</ul>`)
            .replace('<!--AVG_AGE_PLACEHOLDER-->', `<p><strong>Средний возраст:</strong> ${avgAge} лет</p>`);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderedHtml);
    });
}
function getHtml(req, res){
    const filePath = path.join(__dirname, './media/index.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('Файл не найден');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
    });
};
function getPeoplesJson(req, res){
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(dataJson)) 
};
function getPeoples(req, res) {
    // Формируем HTML для каждого человека
    // const htmlList = dataJson.map(person => {
    //     return `
    //         <div style="margin-bottom: 10px;">
    //             <p style="color: red;"><strong>Id:</strong> ${person.id}</p>
    //             <p><strong>Имя:</strong> ${person.name}</p>
    //             <p><strong>Возраст:</strong> ${person.age}</p>
    //         </div>
    //         <hr/>
    //     `;
    // }).join('');
    const htmlList = dataJson.map(person => {
        return `
            <div class="person">
                <div class="name">
                    <span>${person.name}</span>
                    <span>ID: ${person.id}</span>
                </div>

                <div class="telDiv">
                    Возраст: ${person.age}
                </div>
            </div>
        `;
    }).join('');

    // Отправляем HTML-страницу
    // const html = `
    //     <!DOCTYPE html>
    //     <html lang="ru">
    //     <head>
    //         <meta charset="UTF-8">
    //         <title>Список людей</title>
    //     </head>
    //     <body>
    //     <header class="header">
    //         <a href="https://testserver-eight-olive.vercel.app/front/index.html" class="nav-link">🏠 Главная</a>
    //     </header>
    //         <h1>Список людей</h1>
    //         ${htmlList}
    //         <p></p>
    //         <div style="text-align: center; margin-top: 40px;">
    //             <a href='/' style="color: purple; font-size: 30px;">Вернуться на страницу с формой добавления людей</a>
    //         </div>
    //     </body>
    //     </html>
    // `;

    const html = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>Список людей</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">

            <link rel="stylesheet" href="/media/home.css">
        </head>

        <body>

        <header class="header">
            <a href="https://testserver-eight-olive.vercel.app/front/index.html" class="nav-link">🏠 Главная</a>
        </header>

        <main class="container">
            <h1>Список людей</h1>

            <div class="grid">
                ${htmlList}
            </div>

            <div class="back-link">
                <a href="/">Вернуться назад</a>
            </div>
        </main>

        </body>
        </html>
        `;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
}
function postPeopleForm(req, res){
    if(req.headers['content-type'] === 'application/x-www-form-urlencoded'){
    let people = '';
    req.on('data', (chank) => {
        people += chank})
    // if(typeof(people) === 'string'){
        req.on('end', () => {
            const parsedData = querystring.parse(people);
            parsedData.id = parseInt(parsedData.id);
            parsedData.age = parseInt(parsedData.age);
            try {
                        // Добавление в массив
            dataJson.push(parsedData);
            const filePath = path.join(__dirname, './media/endAdd.html');
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    return res.end('Файл не найден');
                }
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(data);
            });
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Ошибка: Некорректный JSON.');
        }
        })
    } else {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Ошибка: Некорректный ввод формы.');
    }
}; 

function postPeopleJson(req, res) {
    let people = '';
    req.on('data', (chunk) => {
        people += chunk;
    });
    req.on('end', () => {
        try {
            // Проверка на дублирующиеся ключи
            const hasDuplicateKeys = /"(\w+)"\s*:\s*[^,]+,\s*"(\1)"\s*:/g.test(people);
            if (hasDuplicateKeys) {
                res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                return res.end('Ошибка: JSON содержит дублирующиеся ключи.');
            }
            const parsedData = JSON.parse(people);
            // Допустимые ключи
            const allowedKeys = ['id', 'name', 'age'];
            const receivedKeys = Object.keys(parsedData);
            // Проверка наличия всех полей
            if (!allowedKeys.every(key => receivedKeys.includes(key))) {
                res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                return res.end('Ошибка: В объекте указаны не все поля.');
            }
            // Проверка наличия только разрешённых ключей
            if (receivedKeys.some(key => !allowedKeys.includes(key))) {
                res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                return res.end('Ошибка: Объект содержит недопустимые поля.');
            }
            // Проверка структуры объекта
            if (
                typeof parsedData.id !== 'number' ||
                typeof parsedData.name !== 'string' ||
                typeof parsedData.age !== 'number' ||
                !parsedData.name.trim() // Проверяем, чтобы name не был пустым
            ) {
                res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                return res.end('Ошибка: Данные представлены некорректно. Объект должен содержать id (число), name (строка) и age (число).');
            }
            // Добавление в массив
            dataJson.push(parsedData);
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('OK, человек добавлен!!!');
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Ошибка: Некорректный JSON.');
        }
    });
}

function getImg(req, res){
    //Если фото на самом сервере:
    // const imgPath = path.join(__dirname, './media/824.jpg');
    // fs.readFile(imgPath, (err, data) => {
    //     if (err) {
    //         res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    //         return res.end('Изображение не найдено');
    //     }
    //     res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    //     res.end(data);
    // });

    //Если фото на другом сервере - проксируем его и передаем клиенту: 
    const imageUrl = 'https://res.cloudinary.com/dbynsbahm/image/upload/v1769426653/plants/nhamijykms5emex8fh8b.webp';
    https.get(imageUrl, (imgRes) => {
        if (imgRes.statusCode !== 200) {
            res.writeHead(imgRes.statusCode, { 'Content-Type': 'text/plain' });
            return res.end('Ошибка загрузки изображения');
        }

        // прокидываем заголовки (очень желательно)
        res.writeHead(200, {
            'Content-Type': imgRes.headers['content-type'] || 'image/webp',
            'Cache-Control': 'public, max-age=86400' // кэш на сутки
        });

        // стримим напрямую клиенту
        imgRes.pipe(res);

    }).on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Ошибка сервера');
    });
};

// async function getImg(req, res) {
//     try {
//         const response = await fetch('https://res.cloudinary.com/dbynsbahm/image/upload/v1769426653/plants/nhamijykms5emex8fh8b.webp');

//         if (!response.ok) {
//             res.writeHead(response.status);
//             return res.end('Ошибка загрузки');
//         }

//         res.writeHead(200, {
//             'Content-Type': response.headers.get('content-type'),
//             'Cache-Control': 'public, max-age=86400'
//         });

//         response.body.pipe(res);

//     } catch (e) {
//         res.writeHead(500);
//         res.end('Ошибка сервера');
//     }
// }

function getMp3(req, res){
    // const mp3Path = path.join(__dirname, './media/Gans.mp3');
    const mp3Path = path.join(__dirname, './media/steklo.mp3');
    // Проверяем, существует ли файл
    if (!fs.existsSync(mp3Path)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Аудио файл не найден');
    }
    // Устанавливаем заголовки для аудиофайла
    res.writeHead(200, { 'Content-Type': 'audio/mpeg' });
    // Создаем поток для чтения и передаем его в `res`
    const readStream = fs.createReadStream(mp3Path);
    readStream.pipe(res); 

 // Заменил на фото:
    // const imgPath = path.join(__dirname, './media/824.jpg');
    // fs.readFile(imgPath, (err, data) => {
    //     if (err) {
    //         res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    //         return res.end('Изображение не найдено');
    //     }
    //     res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    //     res.end(data);
    // });
};
function getVideo(req, res){
    // Заменил на фото:
    // const imgPath = path.join(__dirname, './media/824.jpg');
    // fs.readFile(imgPath, (err, data) => {
    //     if (err) {
    //         res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    //         return res.end('Изображение не найдено');
    //     }
    //     res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    //     res.end(data);
    // });

    //Если видео на самом сервере:
    // const videoPath = path.join(__dirname, './media/video1.mp4');
    // // Проверяем, существует ли файл
    // if (!fs.existsSync(videoPath)) {
    //     res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    //     return res.end('Видео файл не найден');
    // }
    // // Получаем размер файла
    // const stat = fs.statSync(videoPath);
    // const fileSize = stat.size;
    // const range = req.headers.range; // Получаем заголовок Range (если есть)
    // if (range) {
    //     // Если клиент запросил часть файла (например, для перемотки)
    //     const parts = range.replace(/bytes=/, "").split("-");
    //     const start = parseInt(parts[0], 10);
    //     const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    //     if (start >= fileSize) {
    //         res.writeHead(416, { "Content-Range": `bytes */${fileSize}` });
    //         return res.end();
    //     }
    //     const chunkSize = end - start + 1;
    //     const fileStream = fs.createReadStream(videoPath, { start, end });
    //     res.writeHead(206, {
    //         "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    //         "Accept-Ranges": "bytes",
    //         "Content-Length": chunkSize,
    //         "Content-Type": "video/mp4",
    //         "Transfer-Encoding": "chunked"
    //     });
    //     fileStream.pipe(res);
    // } else {
    //     // Если клиент запрашивает весь файл
    //     res.writeHead(200, {
    //         "Content-Length": fileSize,
    //         "Content-Type": "video/mp4",
    //         "Transfer-Encoding": "chunked"
    //     });
    //     const fileStream = fs.createReadStream(videoPath);
    //     fileStream.pipe(res);
    // }

    //Если видео на другом сервере - проксируем его и передаем клиенту: 
    const remoteUrl = 'https://res.cloudinary.com/dbynsbahm/video/upload/c_pad,b_blue,w_1900,ar_1,q_auto,f_auto/VID-20240515-WA0006_diwpbb.mp4';
    https.get(remoteUrl, (proxyRes) => {
        // Устанавливаем соответствующие заголовки
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        // Передаём полученные данные клиенту
        proxyRes.pipe(res);
    }).on('error', (err) => {
        console.error('Ошибка при проксировании видео:', err);
        res.writeHead(500);
        res.end('Ошибка получения видео с внешнего ресурса');
    });
};
function notFound(req, res){
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Page Not Found');
};

module.exports = {getHtml, getHome, getPeoplesJson, getPeoples, postPeopleForm, postPeopleJson, getImg, getMp3, getVideo, notFound}