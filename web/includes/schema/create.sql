CREATE TABLE user(
	id INT AUTO_INCREMENT PRIMARY KEY,
	email VARCHAR(255) NOT NULL,
	password VARCHAR(255) NOT NULL,
	firstName VARCHAR(255),
	lastName VARCHAR(255),
	role varchar(10),
	registered INT
);

CREATE TABLE project(
	id INT AUTO_INCREMENT PRIMARY KEY,
	user INT,
	name VARCHAR(255) NOT NULL,
	description TEXT,
  thumbnailId VARCHAR(30),
	isPublic INT(1) DEFAULT '0' NOT NULL,
	created INT,
  exported DATETIME,
	hash CHAR(40) NOT NULL,
  saveFolder CHAR(40),
	FOREIGN KEY (user) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE clip(
   id INT AUTO_INCREMENT PRIMARY KEY,
   project INT,
   name VARCHAR(255) NOT NULL,
   videoId VARCHAR(30) NOT NULL,
   videoLength FLOAT(10,2) NOT NULL,
   -- times are in the format 'seconds, milliseconds'
   startTime FLOAT(10,2) NOT NULL,
   endTime FLOAT(10,2) NOT NULL,
   FOREIGN KEY (project) REFERENCES project(id) ON DELETE CASCADE
);
