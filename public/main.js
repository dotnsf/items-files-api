//. main.js
$(function(){
  init();
});

function init(){
  $('#items_table_tbody').html( '' );
  $.ajax({
    type: 'GET',
    url: API_SERVER + '/api/db/items',
    success: function( result ){
      console.log( result );
      if( result && result.status && result.items ){
        for( var i = 0; i < result.items.length; i ++ ){
          var item = result.items[i];
          var tr = '<tr>'
            + '<td td_item_id="' + item.id + '" td_file_id=""><img src="' + API_SERVER + '/api/db/file_by_item_id/' + item.id + '?binary=1" width="100"/></td>'
            + '<td>' + item.name + '</td>'
            + '<td>' + item.price + '</td>'
            + '<td>'
            + '<button class="btn btn-warning" onClick="editItem(\'' + item.id + '\',\'' + item.name + '\',\'' + item.price + '\');">編集</button>'
            + '<button class="btn btn-danger" onClick="deleteItem(\'' + item.id + '\',\'' + item.name + '\');">削除</button>'
            + '</td>'
            + '</tr>';
          $('#items_table_tbody').append( tr );
        }

        $.extend( $.fn.dataTable.defaults, {
          language: {
            url: '//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Japanese.json'
          }
        });
        $('#items_table').DataTable({
          columnDefs: [{ 
            targets: [ 0, 3 ], 
            orderable: false,
            searchable: false
          }]
        });
      }
    },
    error: function( e0, e1, e2 ){
      console.log( e0, e1, e2 );
    }
  });
}

function saveItem(){
  var edit_id = $('#edit_id').val();
  var edit_name = $('#edit_name').val();
  var edit_price = $('#edit_price').val();

  if( edit_id ){
    //. 更新
    $.ajax({
      type: 'PUT',
      url: API_SERVER + '/api/db/item/' + edit_id,
      data: { name: edit_name, price: parseInt( edit_price ) },
      success: function( result ){
        console.log( { result } );
        var edit_file = $('#edit_file');
        if( edit_file.prop( 'files' ).length > 0 ){
          var fd = new FormData();
          fd.append( 'image', edit_file.prop( 'files' )[0] );
          $.ajax({
            type: 'PUT',
            url: API_SERVER + '/api/db/file_by_item_id/' + edit_id,
            data: fd,
            processData: false,
            contentType: false,
            cache: false,
            success: function( result ){
              location.href = '/';
            },
            error: function( e0, e1, e2 ){
              console.log( e0, e1, e2 );
            }
          });
        }else{
          location.href = '/';
        }
      },
      error: function( e0, e1, e2 ){
        console.log( e0, e1, e2 );
      },
    });
  }else{
    //. 作成
    $.ajax({
      type: 'POST',
      url: API_SERVER + '/api/db/item',
      data: { name: edit_name, price: parseInt( edit_price ) },
      success: function( result ){
        console.log( { result } );
        var edit_file = $('#edit_file');
        if( edit_file.prop( 'files' ).length > 0 ){
          var fd = new FormData();
          fd.append( 'image', edit_file.prop( 'files' )[0] );
          fd.append( 'item_id', result.item.id );
          $.ajax({
            type: 'POST',
            url: API_SERVER + '/api/db/file',
            data: fd,
            processData: false,
            contentType: false,
            cache: false,
            success: function( result1 ){
              location.href = '/';
            },
            error: function( e0, e1, e2 ){
              console.log( e0, e1, e2 );
            }
          });
        }else{
          location.href = '/';
        }
      },
      error: function( err ){
        console.log( err );
      },
    });
  }
}

function createItem(){
    $('#edit_id').val( '' );
    $('#edit_name').val( '' );
    $('#edit_price').val( '' );

    $('#itemModal').modal( 'show' );
}

function editItem( item_id, item_name, item_price ){
    $('#edit_id').val( item_id );
    $('#edit_name').val( item_name );
    $('#edit_price').val( item_price );

    $('#itemModal').modal( 'show' );
}

function deleteItem( item_id, item_name ){
  if( confirm( item_name + ' を削除します。よろしいですか？' ) ){
    $.ajax({
      type: 'DELETE',
      url: API_SERVER + '/api/db/item/' + item_id,
      success: function( result ){
        $.ajax({
          type: 'DELETE',
          url: API_SERVER + '/api/db/file_by_item_id/' + item_id,
          success: function( result ){
            location.href = '/';
          },
          error: function( e0, e1, e2 ){
            console.log( e0, e1, e2 );
          }
        });
      },
      error: function( e0, e1, e2 ){
        console.log( e0, e1, e2 );
      },
    });
  }
}

