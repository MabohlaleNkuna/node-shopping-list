const http = require('http');
const fsManager = require('./file-manager');
const { v4: uuidv4 } = require('uuid');

try {
  fsManager.createDirectory();
  fsManager.createJSONFile();
} catch (err) {
  console.error('Error initializing directory or file:', err);
}

const sendResponse = (res, statusCode, data) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

const server = http.createServer((req, res) => {
  try {
    if (req.url === '/shopping-list' && req.method === 'GET') {
      const shoppingList = fsManager.readJSONFile();
      sendResponse(res, 200, shoppingList);
    } else if (req.url === '/shopping-list' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        if (!body) {
          sendResponse(res, 400, { message: 'Empty request body' });
          return;
        }

        try {
          const newItem = JSON.parse(body);
          newItem.id = uuidv4();
          const shoppingList = fsManager.readJSONFile();
          shoppingList.push(newItem);
          fsManager.writeJSONFile(shoppingList);
          sendResponse(res, 201, { message: 'Item added successfully.', item: newItem });
        } catch (err) {
          sendResponse(res, 400, { message: 'Invalid JSON format', error: err.message });
        }
      });
    } else if (req.url.startsWith('/shopping-list/') && req.method === 'PUT') {
      const id = req.url.split('/')[2]; 
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        if (!body) {
          sendResponse(res, 400, { message: 'Empty request body' });
          return;
        }

        try {
          const updatedItem = JSON.parse(body);
          let shoppingList = fsManager.readJSONFile();
          const index = shoppingList.findIndex(item => item.id === id);
          
          if (index !== -1) {
            shoppingList[index] = { ...shoppingList[index], ...updatedItem };
            fsManager.writeJSONFile(shoppingList);
            sendResponse(res, 200, { message: 'Item updated successfully.' });
          } else {
            sendResponse(res, 404, { message: 'Item not found.' });
          }
        } catch (err) {
          sendResponse(res, 400, { message: 'Invalid JSON format', error: err.message });
        }
      });
    } else if (req.url.startsWith('/shopping-list/') && req.method === 'DELETE') {
      const id = req.url.split('/')[2]; 
      let shoppingList = fsManager.readJSONFile();
      const newShoppingList = shoppingList.filter(item => item.id !== id); 
      
      if (shoppingList.length === newShoppingList.length) {
        sendResponse(res, 404, { message: 'Item not found.' });
      } else {
        fsManager.writeJSONFile(newShoppingList);
        sendResponse(res, 200, { message: 'Item deleted successfully.' });
      }
    } else {
      sendResponse(res, 404, { message: 'Not Found' });
    }
  } catch (err) {
    sendResponse(res, 500, { message: 'Internal Server Error', error: err.message });
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
