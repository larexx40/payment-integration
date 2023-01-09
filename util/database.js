const { Model } = require('objection');
const Knex = require('knex');
require("dotenv").require()

// Initialize knex.
const knex = Knex({
    client: "mysql",
    connection: {
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    },
  });
  
  // Give the knex instance to objection.
  Model.knex(knex);
  
  module.exports = knex;