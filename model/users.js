const { Model } = require('objection');

class User extends Model {
  // Table name is the only required property.
  static get tableName() {
    return 'users';
  }

 

  $beforeInsert() {
    this.date_created = new Date().toISOString().slice(0, 10);
    this.date_updated = new Date().toISOString().slice(0, 10);
  }
  $beforeUpdate() {
    this.date_updated = new Date().toISOString().slice(0, 10);
  }

  // Each model must have a column (or a set of columns) that uniquely
  // identifies the rows. The column(s) can be specified using the `idColumn`
  // property. `idColumn` returns `id` by default and doesn't need to be
  // specified unless the model's primary key is something else.
  static get idColumn() {
    return 'user_id';
  }

  // Methods can be defined for model classes just as you would for
  // any JavaScript class. If you want to include the result of these
  // methods in the output json, see `virtualAttributes`.
  fullName() {
    return this.firstName + ' ' + this.lastName;
  }

  // Optional JSON schema. This is not the database schema!
  // No tables or columns are generated based on this. This is only
  // used for input validation. Whenever a model instance is created
  // either explicitly or implicitly it is checked against this schema.
  // See http://json-schema.org/ for more info.
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['firstName', 'lastName'],

      properties: {
        id: { type: 'integer' },
        parentId: { type: ['integer', 'null'] },
        firstName: { type: 'string', minLength: 1, maxLength: 255 },
        lastName: { type: 'string', minLength: 1, maxLength: 255 },
        age: { type: 'number' },

        // Properties defined as objects or arrays are
        // automatically converted to JSON strings when
        // writing to database and back to objects and arrays
        // when reading from database. To override this
        // behaviour, you can override the
        // Model.jsonAttributes property.
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            zipCode: { type: 'string' }
          }
        }
      }
    };
  }

  // This object defines the relations to other models.
  static get relationMappings() {
    // Importing models here is one way to avoid require loops.
    const Transaction = require('./transactions');


    return {
      transaction: {
        relation: Model.HasManyRelation,
        modelClass: Transaction,
        join: {
          from: 'users.id',
          to: 'transactions.tnx_id'
        }
      },
    };
  }
}

module.exports = User;