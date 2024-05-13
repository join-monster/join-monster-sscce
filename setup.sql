DROP TABLE IF EXISTS card;
CREATE TABLE card (
  id VARCHAR(32) PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  setId VARCHAR(64),
  CONSTRAINT FK_setId FOREIGN KEY (setId) REFERENCES 'set'(id)
);

DROP TABLE IF EXISTS 'set';
CREATE TABLE 'set' (
  id VARCHAR(64) PRIMARY KEY NOT NULL,
  fullName VARCHAR(128) NOT NULL,
  shortName VARCHAR(8) NOT NULL
);

insert into 'set' (id, fullName, shortName) values ('1', 'Alpha', 'A');
insert into card (id, name, setId) values ('1', 'Black Lotus', '1');