# Shopping List API with Image Upload

This is a simple Node.js server that allows you to manage a shopping list with CRUD (Create, Read, Update, Delete) operations. It also supports image uploads for each item.

## Features

- **GET** `/shopping-list`: Retrieves the current shopping list.
- **POST** `/shopping-list`: Adds a new item to the shopping list (with image upload).
- **PUT** `/shopping-list/:id`: Updates an existing item (with optional image replacement).
- **DELETE** `/shopping-list/:id`: Deletes an item and its associated image.
- **GET** `/uploads/:filename`: Accesses uploaded image files.

## Requirements

- Node.js
- npm

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/MabohlaleNkuna/node-file-system.git
   cd node-file-system
