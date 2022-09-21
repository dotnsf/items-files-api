# REST API sample for items and files

## Overview

Sample REST API application with Node.js

This is a web application which offers ...

1. REST(CRUD) APIs with swagger doc, and

2. front-end index page.

APIs are based on memory-based simple DB.


## Environment values

  - `API_SERVER` : Base URL of API Server(Default:'')

  - `CORS` : CORS allowed URL origin(Default:'')

  - `PORT` : Listening port number(Default:8080)


## How to run on terminal

- `$ npm start`

  - Runs on port 8080, API_SERVER=''(local), and with no CORS.

- `$ PORT=8081 API_SERVER=http://localhost:8080 npm start`

  - Runs on port 8081, API_SERVER='http://localhost:8080', and with no CORS.

- `$ CORS=http://localhost:8081 npm start`

  - Runs on port 8080, API_SERVER=''(local), and with CORS from 'http://localhost:8081'.


## How to run on docker

- `$ docker run -d --name node-rest-api -e PORT=8080 -p 8080:8080 dotnsf/items-files-api`

  - Runs on port 8080, API_SERVER=''(local), and with no CORS.

- `$ docker run -d --name node-rest-api-back -e PORT=8080 -p 8080:8080 -e CORS=http://localhost:8081 dotnsf/items-files-api`

  - Runs on port 8080, API_SERVER=''(local), and with CORS=http://localhost:8081.

- `$ docker run -d --name node-rest-api-front -e PORT=8081 -e API_SERVER=http://localhost:8080 -p 8081:8081 dotnsf/items-files-api`

  - Runs on port 8081, API_SERVER=http://localhost:8080, and with no CORS.


## Avalable CRUD APIs

- `Create`

  - `POST /api/db/item`

  - `POST /api/db/items`

  - `POST /api/db/file`

- `Read`

  - `GET /api/db/item/:id`

  - `GET /api/db/items`

  - `GET /api/db/items/:key`

  - `GET /api/db/file/:id`

  - `GET /api/db/file/:id?binary=1`

- `Update`

  - `PUT /api/db/item/:id`

  - `PUT /api/db/items`

  - `PUT /api/db/file/:id`

- `Delete`

  - `DELETE /api/db/item/:id`

  - `DELETE /api/db/items`

  - `DELETE /api/db/file/:id`


## Avalable Swagger API(only for localhost)

- `http://localhost:8080/_doc`


## Licensing

This code is licensed under MIT.


## Copyright

2022 K.Kimura @ Juge.Me all rights reserved.

