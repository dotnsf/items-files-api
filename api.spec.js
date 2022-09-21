//. api.spec.js

var request = require( 'supertest' ),
    chai = require( 'chai' ),
    app = require( './app' );

chai.should();

describe( 'POST item, GET item, DELETE item', function(){
  it( 'should work as expected', async function(){
    var item_id = 'test_id';
    var result0 = await request( app ).get( '/api/db/item/' + item_id );
    result0.statusCode.should.equal( 400 );
    result0.body.status.should.equal( false );

    var result1 = await request( app ).post( '/api/db/item' ).send( { id: item_id, name: 'Shampoo', price: 500 } );
    result1.body.status.should.equal( true );
    result1.statusCode.should.equal( 200 );

    var result2 = await request( app ).get( '/api/db/item/' + item_id );
    result2.statusCode.should.equal( 200 );
    result2.body.status.should.equal( true );
    result2.body.result.id.should.equal( item_id );

    var result3 = await request( app ).delete( '/api/db/item/' + item_id );
    result3.statusCode.should.equal( 200 );
    result3.body.status.should.equal( true );

    var result4 = await request( app ).get( '/api/db/item/' + item_id );
    result4.statusCode.should.equal( 400 );
    result4.body.status.should.equal( false );
  });
});
