/* items-files.ddl */

/* items */
drop table items;
create table if not exists items ( id varchar(50) not null primary key, name varchar(50) default '', price int default 0, created bigint default 0, updated bigint default 0 );

/* files */
drop table files;
create table if not exists files ( id varchar(50) not null primary key, item_id varchar(50) default '', body bytea, contenttype varchar(50) default '', filename varchar(50) default '', created bigint default 0, updated bigint default 0 );
