import assert from 'assert/strict';

import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLString,
} from 'graphql';

import pkg from 'join-monster';
const joinMonster = pkg.default;

import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// modifiy here if you want to use another database
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './setup.db'
  }
});

// begin your definition of the schema
const Product = new GraphQLObjectType({
  name: 'Product',
  extensions: {
    joinMonster: {
      sqlTable: 'products',
      uniqueKey: 'id',
    },
  },
  fields: {
    id: {
      type: GraphQLInt
    },
    name: {
      type: GraphQLString
    },
  }
});

const OrderItem = new GraphQLObjectType({
  name: 'OrderItem',
  extensions: {
    joinMonster: {
      sqlTable: '(select * from orders o, json_each(o.items) i)',
      uniqueKey: 'key',
    },
  },
  fields: {
    quantity: {
      type: GraphQLInt,
      extensions: {
        joinMonster: {
          sqlExpr: (table, args) => `${table}.value->>'quantity'`
        }
      }
    },
    product: {
      type: Product,
      extensions: {
        joinMonster: {
          sqlJoin: (oi, p) => `${oi}.value->>'product_id' = ${p}.id`
        }
      }
    },
  }
});

const Order = new GraphQLObjectType({
  name: 'Order',
  extensions: {
    joinMonster: {
      sqlTable: 'orders',
      uniqueKey: 'id',
    },
  },
  fields: {
    id: {
      type: GraphQLInt
    },
    items: {
      type: new GraphQLList(OrderItem),
      extensions: {
        joinMonster: {
          sqlJoin: (o, oi) => `${o}.id = ${oi}.id`
        },
      },
    }
  }
});
// end your definition of the schema

const QueryRoot = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    orders: {
      type: new GraphQLList(Order),
      resolve: (parent, args, context, resolveInfo) => {
        return joinMonster(resolveInfo, {}, sql => {
          console.log(sql);
          return knex.raw(sql)
        })
      }
    }
  })
});

const schema = new GraphQLSchema({
  description: 'a test schema',
  query: QueryRoot
});


(async () => {
  // define the query you want to test
  const source = `
  {
    orders {
      id
      items {
        quantity
        product {
          id
          name
        }
      }
    }
  }
  `;

  // define the expected result
  const expected = {
    orders: [
      {
        id: 1,
        items: [
          {
            product: {
              id: 1,
              name: 'prdudct1'
            },
            quantity: 30
          },
          {
            product: {
              id: 2,
              name: 'prdudct2'
            },
            quantity: 10
          }
        ]
      },
      {
        id: 2,
        items: [
          {
            product: {
              id: 1,
              name: 'prdudct1'
            },
            quantity: 30
          }
        ]
      },
      {
        id: 3,
        items: [
          {
            product: {
              id: 1,
              name: 'prdudct1'
            },
            quantity: 30
          }
        ]
      }
    ]
  };

  const { data, errors } = await graphql({ schema, source });

  if (errors?.length) {
    console.error(errors);
  }

  // JSON.parse of JSON.stringify bc of https://github.com/apollographql/apollo-server/issues/3149
  assert.deepEqual(JSON.parse(JSON.stringify(data)), expected);

  console.log('test passed');

  knex.destroy();
})();