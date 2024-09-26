installed uuid for auto id,s
npm install uuid

type "node server.js" on terminal to start

OPEN POSTMAN AND 

//GET item
GET http://localhost:3000/shopping-list

POST ITEM
POST http://localhost:3000/shopping-list
{
  "item": "NNNN",
  "quantity": 5
}// 

//PUT Update Item
PUT http://localhost:3000/shopping-list/{id}
{
  "item": "",
  "quantity": 
}

//DELETE Item:
DELETE http://localhost:3000/shopping-list/{id}
