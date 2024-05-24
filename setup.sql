DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  items JSON
);

DROP TABLE IF EXISTS products;
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255)
);

insert into orders (items) values ('[{"quantity": 30, "product_id": 1}, {"quantity": 10, "product_id": 2}]');
insert into orders (items) values ('[{"quantity": 3, "product_id": 1}]');
insert into orders (items) values ('[{"quantity": 6, "product_id": 2}]');

insert into products (name) values ('prdudct1');
insert into products (name) values ('prdudct2');