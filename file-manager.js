const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, 'data');
const filePath = path.join(dirPath, 'shopping-list.json');

const createDirectory = () => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
    console.log('Directory created:', dirPath);
  }
};

const createJSONFile = () => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([])); 
    console.log('JSON file created:', filePath);
  }
};

const readJSONFile = () => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON file:', err);
    return [];
  }
};

const writeJSONFile = (data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('JSON file updated.');
  } catch (err) {
    console.error('Error writing JSON file:', err);
  }
};

module.exports = {
  createDirectory,
  createJSONFile,
  readJSONFile,
  writeJSONFile
};
