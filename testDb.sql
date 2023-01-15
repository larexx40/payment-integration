CREATE TABLE IF NOT EXISTS `customers` (
  `user_id` int(11) AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `firstName` varchar(255),
  `lastName` varchar(2555),
  `age` int(11),
  `date_created` date NOT NULL,
  `date_updated` date NOT NULL,
  PRIMARY KEY (`user_id`)
  -- CONSTRAINT email_unique UNIQUE (`email`)
);


INSERT INTO users (email, firstName, lastName, age) VALUES("larexx40@gmail.com", "olanrewaju", "olatunji", 44)

CREATE TABLE IF NOT EXISTS `transactions` (
  `tnx_id` int(11) AUTO_INCREMENT,
  `paymentMethod` varchar(255) NOT NULL,
  `paymentProvider` varchar(255),
  `amount` varchar(2555),
  `paymentStatus` varchar(255),
  `tnx_ref` varchar(2555) NOT NULL,
  `user_id` int(11),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tnx_id`)
);


CREATE TABLE IF NOT EXISTS `bankallowed` (
  `bannk_id` int(11) AUTO_INCREMENT,
  `bankcode` varchar(25) NOT NULL,
  `flutterwave_code` varchar(25) NOT NULL,
  `monnify_code` varchar(25) NOT NULL,
  `status` varchar(255) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tnx_id`)
);



