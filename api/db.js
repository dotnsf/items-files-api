//. db_postgres.js

var express = require( 'express' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    fs = require( 'fs' ),
    { v4: uuidv4 } = require( 'uuid' ),
    api = express();

require( 'dotenv' ).config();

//process.env.PGSSLMODE = 'no-verify';
var PG = require( 'pg' );
//PG.defaults.ssl = true;
var database_url = 'DATABASE_URL' in process.env ? process.env.DATABASE_URL : ''; 

var settings_cors = 'CORS' in process.env ? process.env.CORS : '';
api.all( '/*', function( req, res, next ){
  if( settings_cors ){
    res.setHeader( 'Access-Control-Allow-Origin', settings_cors );
    res.setHeader( 'Vary', 'Origin' );
  }
  next();
});

var pg = null;
if( database_url ){
  console.log( 'database_url = ' + database_url );
  pg = new PG.Pool({
    connectionString: database_url,
    //ssl: { require: true, rejectUnauthorized: false },
    idleTimeoutMillis: ( 3 * 86400 * 1000 )
  });
  pg.on( 'error', function( err ){
    console.log( 'error on working', err );
    if( err.code && err.code.startsWith( '5' ) ){
      try_reconnect( 1000 );
    }
  });
}

function try_reconnect( ts ){
  setTimeout( function(){
    console.log( 'reconnecting...' );
    pg = new PG.Pool({
      connectionString: database_url,
      //ssl: { require: true, rejectUnauthorized: false },
      idleTimeoutMillis: ( 3 * 86400 * 1000 )
    });
    pg.on( 'error', function( err ){
      console.log( 'error on retry(' + ts + ')', err );
      if( err.code && err.code.startsWith( '5' ) ){
        ts = ( ts < 10000 ? ( ts + 1000 ) : ts );
        try_reconnect( ts );
      }
    });
  }, ts );
}


api.use( multer( { dest: '../tmp/' } ).single( 'image' ) );
api.use( bodyParser.urlencoded( { extended: true } ) );
api.use( bodyParser.json() );
api.use( express.Router() );

//. Create
api.createItem = async function( item ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var sql = 'insert into items( id, name, price, created, updated ) values ( $1, $2, $3, $4, $5 )';
          //var sql = "select * from items";
          if( !item.id ){
            item.id = uuidv4();
          }
          var t = ( new Date() ).getTime();
          item.created = t;
          item.updated = t;
          var query = { text: sql, values: [ item.id, item.name, item.price, item.created, item.updated ] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              resolve( { status: true, item: item } );
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

api.createItems = function( items ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var num = 0;
          var count = 0;

          var sql = 'insert into items( id, name, price, created, updated ) values ( $1, $2, $3, $4, $5 )';
          for( var i = 0; i < items.length; i ++ ){
            var item = items[i];
            if( !item.id ){
              item.id = uuidv4();
            }
            if( typeof item.price == 'string' ){
              item.price = parseInt( item.price );
            }
            var t = ( new Date() ).getTime();
            item.created = t;
            item.updated = t;
            var query = { text: sql, values: [ item.id, item.name, item.price, item.created, item.updated ] };
            conn.query( query, function( err, result ){
              num ++;
              if( err ){
                console.log( err );
              }else{
                count ++;
              }

              if( num == items.length ){
                resolve( { status: true, items: items, count: count } );
              }
            });
          }
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

api.createFile = async function( file ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var ts = ( new Date() ).getTime();
          var sql = "insert into files( id, item_id, body, contenttype, filename, created, updated ) values( $1, $2, $3, $4, $5, $6, $7 )";
          var query = { text: sql, values: [ file.id, file.item_id, file.body, file.contenttype, file.filename, ts, ts ] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              delete file.body;
              resolve( { status: true, file: file } );
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

//. Read
api.readItem = async function( item_id ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var sql = "select * from items where id = $1";
          var query = { text: sql, values: [ item_id ] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              if( result && result.rows && result.rows.length > 0 ){
                resolve( { status: true, item: result.rows[0] } );
              }else{
                resolve( { status: false, error: 'no data' } );
              }
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

//. Reads
api.readItems = async function( limit, offset ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var sql = "select * from items order by updated";
          if( limit ){
            sql += " limit " + limit;
          }
          if( offset ){
            sql += " start " + offset;
          }
          var query = { text: sql, values: [] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              resolve( { status: true, items: result.rows } );
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

api.readFile = async function( file_id ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var sql = "select * from files where id = $1";
          var query = { text: sql, values: [ file_id ] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              if( result && result.rows && result.rows.length > 0 ){
                resolve( { status: true, file: result.rows[0] } );
              }else{
                resolve( { status: false, error: 'no data' } );
              }
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

api.readFileByItemId = async function( item_id ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var sql = "select * from files where item_id = $1";
          var query = { text: sql, values: [ item_id ] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              if( result && result.rows && result.rows.length > 0 ){
                resolve( { status: true, file: result.rows[0] } );
              }else{
                resolve( { status: false, error: 'no data' } );
              }
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

api.queryItems = async function( key, limit, offset ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var sql = "select * from items where name like '%" + key + "%' order by updated";
          if( limit ){
            sql += " limit " + limit;
          }
          if( offset ){
            sql += " start " + offset;
          }
          var query = { text: sql, values: [] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              resolve( { status: true, items: result.rows } );
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

//. Update
api.updateItem = async function( item ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        if( !item.id ){
          resolve( { status: false, error: 'no id.' } );
        }else{
          try{
            var sql = 'update items set name = $1, price = $2, updated = $3 where id = $4';
            //var sql = "select * from items";
            var t = ( new Date() ).getTime();
            item.updated = t;
            var query = { text: sql, values: [ item.name, item.price, item.updated, item.id ] };
            conn.query( query, function( err, result ){
              if( err ){
                console.log( err );
                resolve( { status: false, error: err } );
              }else{
                resolve( { status: true, item: item } );
              }
            });
          }catch( e ){
            console.log( e );
            resolve( { status: false, error: err } );
          }finally{
            if( conn ){
              conn.release();
            }
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

api.updateItems = async function( items ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var num = 0;
          var count = 0;

          var sql = 'update items set name = $1, price = $2, updated = $3 where id = $4';
          for( var i = 0; i < items.length; i ++ ){
            var item = items[i];
            if( typeof item.price == 'string' ){
              item.price = parseInt( item.price );
            }
            var t = ( new Date() ).getTime();
            item.updated = t;
            var query = { text: sql, values: [ item.name, item.price, item.updated, item.id ] };
            conn.query( query, function( err, result ){
              num ++;
              if( err ){
                console.log( err );
              }else{
                count ++;
              }

              if( num == items.length ){
                resolve( { status: true, items: items, count: count } );
              }
            });
          }
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

api.updateFile = async function( file ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        if( !file.id ){
          resolve( { status: false, error: 'no id.' } );
        }else{
          try{
            var sql = 'update files set item_id = $1, body = $2, contenttype = $3, filename = $4, updated = $5 where id = $6';
            //var sql = "select * from items";
            var ts = ( new Date() ).getTime();
            item.updated = ts;
            var query = { text: sql, values: [ file.item_id, file.body, file.contenttype, file.filename, file.updated, file.id ] };
            conn.query( query, function( err, result ){
              if( err ){
                console.log( err );
                resolve( { status: false, error: err } );
              }else{
                resolve( { status: true, file: file } );
              }
            });
          }catch( e ){
            console.log( e );
            resolve( { status: false, error: err } );
          }finally{
            if( conn ){
              conn.release();
            }
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

api.updateFileByItemId = async function( file ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        if( !file.item_id ){
          resolve( { status: false, error: 'no item_id.' } );
        }else{
          try{
            var sql = 'update files set body = $l, contenttype = $2, filename = $3, updated = $4 where item_id = $5';
            //var sql = "select * from items";
            var t = ( new Date() ).getTime();
            item.updated = t;
            var query = { text: sql, values: [ file.body, file.contenttype, file.filename, file.updated, file.item_id ] };
            conn.query( query, function( err, result ){
              if( err ){
                console.log( err );
                resolve( { status: false, error: err } );
              }else{
                resolve( { status: true, file: file } );
              }
            });
          }catch( e ){
            console.log( e );
            resolve( { status: false, error: err } );
          }finally{
            if( conn ){
              conn.release();
            }
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

//. Delete
api.deleteItem = async function( item_id ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var sql = "delete from items where id = $1";
          var query = { text: sql, values: [ item_id ] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              resolve( { status: true, result: result } );
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

api.deleteItems = async function(){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var sql = "delete from items";
          var query = { text: sql, values: [] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              resolve( { status: true, result: result } );
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

api.deleteFile = async function( file_id ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var sql = "delete from files where id = $1";
          var query = { text: sql, values: [ file_id ] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              resolve( { status: true, result: result } );
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

api.deleteFileByItemId = async function( item_id ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var sql = "delete from files where item_id = $1";
          var query = { text: sql, values: [ item_id ] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              resolve( { status: true, result: result } );
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: e } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};


api.post( '/item', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item = req.body;
  item.price = parseInt( item.price );
  api.createItem( item ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.post( '/items', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var items = req.body;
  items.forEach( function( item ){
    if( typeof item.price == 'string' ){
      item.price = parseInt( item.price );
    }
    if( !item.id ){
      item.id = uuidv4();
    }
  });

  api.createItems( items ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.post( '/file', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var filepath = req.file.path;
  var filetype = req.file.mimetype;
  var filename = req.file.originalname;

  var body = fs.readFileSync( filepath );
  var item_id = req.body.item_id;
  var file = {
    id: uuidv4(),
    item_id: item_id,
    body: body,
    contenttype: filetype,
    filename: filename
  };
  api.createFile( file ).then( function( result ){
    delete result.file.body;
    fs.unlink( filepath, function( err ){} );
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/item/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  api.readItem( item_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/items', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var limit = req.query.limit ? parseInt( limit ) : 0;
  var offset = req.query.offset ? parseInt( offset ) : 0;
  api.readItems( limit, offset ).then( function( results ){
    res.status( results.status ? 200 : 400 );
    res.write( JSON.stringify( results, null, 2 ) );
    res.end();
  });
});

api.get( '/items/:key', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var key = req.params.key;
  api.queryItems( key ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/file/:id', async function( req, res ){
  var file_id = req.params.id;
  var binary = req.query.binary;
  api.readFile( file_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    if( result.status && binary ){
      res.contentType( result.file.contenttype );
      res.end( result.file.body, 'binary' );
    }else{
      delete result.file.body;
      res.contentType( 'application/json; charset=utf-8' );
      res.write( JSON.stringify( result, null, 2 ) );
      res.end();
    }
  });
});

api.get( '/file_by_item_id/:id', async function( req, res ){
  var item_id = req.params.id;
  var binary = req.query.binary;
  api.readFileByItemId( item_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    if( result.status && binary ){
      res.contentType( result.file.contenttype );
      res.end( result.file.body, 'binary' );
    }else{
      delete result.file.body;
      res.contentType( 'application/json; charset=utf-8' );
      res.write( JSON.stringify( result, null, 2 ) );
      res.end();
    }
  });
});

api.put( '/item/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  var item = req.body;
  item.id = item_id;
  api.updateItem( item ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.put( '/items', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var items = req.body;
  items.forEach( function( item ){
    if( typeof item.price == 'string' ){
      item.price = parseInt( item.price );
    }
  });

  api.updateItems( items ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.put( '/file/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var filepath = req.file.path;
  var filetype = req.file.mimetype;
  var filename = req.file.originalname;

  var body = fs.readFileSync( filepath );
  var id = req.body.id;
  var item_id = req.body.item_id;
  var file = {
    id: id,
    item_id: item_id,
    body: body,
    contenttype: filetype,
    filename: filename
  };
  api.updateFile( file ).then( function( result ){
    delete result.body;
    fs.unlink( filepath, function( err ){} );
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.put( '/file_by_item_id/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var filepath = req.file.path;
  var filetype = req.file.mimetype;
  var filename = req.file.originalname;

  var body = fs.readFileSync( filepath );
  var item_id = req.params.id;
  var file = {
    id: id,
    item_id: item_id,
    body: body,
    contenttype: filetype,
    filename: filename
  };
  api.updateFileByItemId( file ).then( function( result ){
    delete result.body;
    fs.unlink( filepath, function( err ){} );
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.delete( '/item/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  api.deleteItem( item_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.delete( '/items', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  api.deleteItems().then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.delete( '/file/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var file_id = req.params.id;
  api.deleteFile( file_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.delete( '/file_by_item_id/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  //. :id は file_id ではなく item_id とみなして検索する（そうしないと見つけられない）
  var item_id = req.params.id;
  api.deleteFileByItemId( item_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});



//. api をエクスポート
module.exports = api;
