const { Model } = require('objection');
const Knex = require('knex');
require("dotenv").config()

// Initialize knex.
const knex = Knex({
    client: "mysql",
    connection: {
      // host: process.env.MYSQL_HOST,
      // user: process.env.MYSQL_USER,
      // password: process.env.MYSQL_PASSWORD,
      // database: process.env.MYSQL_DATABASE,
      host: 'localhost',
      user: 'root',
      password: '',	
      database: 'test'
    },
  });

  knex.raw("SELECT VERSION()").then(()=>{
    console.log("Connected to database successfully");
  })
  
  // Give the knex instance to objection.
  Model.knex(knex);
  
  module.exports = knex;