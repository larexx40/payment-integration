const { Model } = require("objection");
const {generateUniqueTnxRef} = require("../helpers/commonFunctions");


class Transaction extends Model {
  static get tableName() {
    return "transactions";
  }

  $beforeInsert() {
    this.date_created = new Date().toISOString().slice(0, 10);
    this.date_updated = new Date().toISOString().slice(0, 10);
    this.tnx_ref = generateUniqueTnxRef();
  }
  $beforeUpdate() {
    this.date_updated = new Date().toISOString().slice(0, 10);
  }

  static get idColumn() {
    return "txn_id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        paymentType: {type: "string"},
        paymentMethod: {type: "string"},
        paymentProvider:{type: "string"},
        amount: {type: "number"},
        status: { type: "integer" },
        paymentStatus: {type: "status"},
        tnx_ref: {type: "string"},
        user_id: {type: "integer"}
      },
    };
  }

  static get relationMappings() {
    const User = require("./users");

    return {
      User: {
        relation: Model.HasOneRelation,
        modelClass: User,
        join: {
          from: "transactions.user_id",
          to: "users.user_id",
        },
      },
    };
  }
}

module.exports = Transaction;
