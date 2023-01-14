const { Model } = require('objection');

class User extends Model {
  // Table name is the only required property.
  static get tableName() {
    return 'customers';
  }


  $beforeInsert() {
    this.created_at = new Date().toISOString().slice(0, 10);
    this.updated_at = new Date().toISOString().slice(0, 10);
  }
  $beforeUpdate() {
    this.updated_at = new Date().toISOString().slice(0, 10);
  }

  static get idColumn() {
    return 'id';
  }
  
  fullName() {
    return this.firstName + ' ' + this.lastName;
  }
  
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['firstName', 'lastName'],

      properties: {
        id: { type: 'integer' },
        firstName: { type: 'string', minLength: 1, maxLength: 255 },
        lastName: { type: 'string', minLength: 1, maxLength: 255 },
        age: { type: 'number' }
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