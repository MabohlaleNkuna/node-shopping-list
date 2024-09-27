const fs = require('fs');
const http = require('http');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = './data';
const imagePath = './uploads';

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
  const filePath = `${imagePath}/${imageFileName}`;
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
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
  } else if (req.method === 'POST' && req.url === '/shopping-list') {
    upload.single('image')(req, res, (err) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Image upload failed' }));
      }

      const { name, quantity } = req.body;

      if (!name || !quantity) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Missing required fields' }));
      }

      const shoppingList = readShoppingList();
      const newItem = {
        id: uuidv4(),
        name,
        quantity,
        image: req.file ? req.file.filename : null
      };

      shoppingList.push(newItem);
      updateShoppingList(shoppingList);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Item added', id: newItem.id, image: newItem.image }));
    });
  } else if (req.method === 'PUT' && req.url.startsWith('/shopping-list/')) {
    const id = req.url.split('/')[2];
    let body = '';

    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      if (!body) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Request body is missing' }));
      }

      try {
        const updatedData = JSON.parse(body);
        const shoppingList = readShoppingList();
        const itemIndex = shoppingList.findIndex(item => item.id === id);

        if (itemIndex === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: 'Item not found' }));
        }

        if (!updatedData.name || !updatedData.quantity) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Missing required fields' }));
        }

        shoppingList[itemIndex] = { ...shoppingList[itemIndex], ...updatedData };
        updateShoppingList(shoppingList);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Item updated', item: shoppingList[itemIndex] }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON format' }));
      }
    });
  } else if (req.method === 'PATCH' && req.url.startsWith('/shopping-list/')) {
    const id = req.url.split('/')[2];
    let body = '';

    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      if (!body) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Request body is missing' }));
      }

      try {
        const partialData = JSON.parse(body);
        const shoppingList = readShoppingList();
        const itemIndex = shoppingList.findIndex(item => item.id === id);

        if (itemIndex === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: 'Item not found' }));
        }

        // Only update provided fields
        shoppingList[itemIndex] = { ...shoppingList[itemIndex], ...partialData };
        updateShoppingList(shoppingList);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Item partially updated', item: shoppingList[itemIndex] }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON format' }));
      }
    });
  } else if (req.method === 'DELETE' && req.url.startsWith('/shopping-list/')) {
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
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Route not found' }));
  }
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
