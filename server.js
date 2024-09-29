const fs = require('fs'); 
const http = require('http');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = './data';
const imagePath = './uploads';
const busboy = require('busboy');
const pathLib = require('path');

if (!fs.existsSync(path)) {
  fs.mkdirSync(path);
}

if (!fs.existsSync(imagePath)) {
  fs.mkdirSync(imagePath);
}

const filePath = `${path}/shoppingList.json`;

if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify([]));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagePath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

const readShoppingList = () => {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
};

const updateShoppingList = (newData) => {
  fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
};

const deleteImageFile = (imageFileName) => {
  const imagePathToDelete = `${imagePath}/${imageFileName}`;
  if (fs.existsSync(imagePathToDelete)) {
    fs.unlinkSync(imagePathToDelete);
  }
};

const server = http.createServer((req, res) => {

  if (req.method === 'GET' && req.url.startsWith('/uploads/')) {
    const filePath = `.${req.url}`;
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end(JSON.stringify({ message: 'File not found' }));
      }
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(data);
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/shopping-list') {
    const shoppingList = readShoppingList();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(shoppingList));
  }

  else if (req.method === 'POST' && req.url === '/shopping-list') {
    let imgPath = "";

    const bb = busboy({ headers: req.headers });

    bb.on("file", (name, file, info) => {
      if (info.mimeType.includes("image")) {
        let extension = info.filename.substring(info.filename.indexOf(".") + 1);
        const imgName = `${uuidv4()}-upload-${Date.now()}.${extension}`;
        const saveTo = pathLib.join(imagePath, imgName);
        imgPath = imgName;
        file.pipe(fs.createWriteStream(saveTo));
      }
    });

    let body = {};
    bb.on("field", (name, val) => {
      body[name] = val;
    });

    bb.on("close", () => {
      const { name, category, quantity } = body;

      if (!name || !quantity || !category) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Missing required fields' }));
      }

      const shoppingList = readShoppingList();
      const newItem = {
        id: uuidv4(),
        name,
        category,
        quantity,
        image: imgPath || null,
      };

      shoppingList.push(newItem);
      updateShoppingList(shoppingList);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Item added', id: newItem.id, image: newItem.image }));
    });

    req.pipe(bb);
  }

  else if (req.method === 'PUT' && req.url.startsWith('/shopping-list/')) {
    const id = req.url.split('/')[2];
    let imgPath = "";

    const bb = busboy({ headers: req.headers });

    bb.on("file", (name, file, info) => {
      if (info.mimeType.includes("image")) {
        let extension = info.filename.substring(info.filename.indexOf(".") + 1);
        const imgName = `${uuidv4()}-upload-${Date.now()}.${extension}`;
        const saveTo = pathLib.join(imagePath, imgName);
        imgPath = imgName;
        file.pipe(fs.createWriteStream(saveTo));
      }
    });

    let body = {};
    bb.on("field", (name, val) => {
      body[name] = val;
    });

    bb.on("close", () => {
      const { name, category, quantity } = body;
      const shoppingList = readShoppingList();
      const itemIndex = shoppingList.findIndex(item => item.id === id);

      if (itemIndex === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'Item not found' }));
      }

      if (!name || !quantity || !category) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Missing required fields' }));
      }

      const oldImage = shoppingList[itemIndex].image;

      const updatedItem = {
        ...shoppingList[itemIndex],
        name,
        category,
        quantity,
        image: imgPath || oldImage,
      };

      shoppingList[itemIndex] = updatedItem;
      updateShoppingList(shoppingList);

      if (imgPath && oldImage) {
        deleteImageFile(oldImage);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Item updated', item: updatedItem }));
    });

    req.pipe(bb);
  }

  else if (req.method === 'DELETE' && req.url.startsWith('/shopping-list/')) {
    const id = req.url.split('/')[2];
    let shoppingList = readShoppingList();
    const itemToDelete = shoppingList.find(item => item.id === id);

    if (!itemToDelete) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Item not found' }));
    } else {
      const updatedList = shoppingList.filter(item => item.id !== id);
      updateShoppingList(updatedList);

      if (itemToDelete.image) {
        deleteImageFile(itemToDelete.image);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Item and associated image deleted' }));
    }
  }

  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Route not found' }));
  }
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
