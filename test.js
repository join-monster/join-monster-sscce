import assert from 'assert/strict';

import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
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
const GraphQLSet = new GraphQLObjectType({
  name: `Set`,
  extensions: {
    joinMonster: {
      sqlTable: `set`,
      uniqueKey: `id`,
    }
  },
  fields: () => ({
    id: { type: GraphQLString },
    fullName: { type: GraphQLString },
    shortName: { type: GraphQLString },
  })
})

const GraphQLCard = new GraphQLObjectType({
  name: `Card`,
  extensions: {
    joinMonster: {
      sqlTable: `card`,
      uniqueKey: `id`,
    }
  },
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    set: {
      type: GraphQLSet,
      sqlJoin: (myTable, parentTable) => `${myTable}.id = ${parentTable}.setId`
    }
  })
})
// end your definition of the schema

const QueryRoot = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    cards: {
      type: new GraphQLList(GraphQLCard),
      resolve: (parent, args, context, resolveInfo) => {
        return joinMonster(resolveInfo, {}, sql => {
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
    cards {
      id
      name
    }
  }
  `;

  // define the expected result
  const expected = {
    cards: [{
      id: '1',
      name: 'Black Lotus'
    }]
  };
  
  const { data, errors } = await graphql({schema, source});
  
  if (errors?.length) {
    console.error(errors);
  }

  // JSON.parse of JSON.stringify bc of https://github.com/apollographql/apollo-server/issues/3149
  assert.deepEqual(JSON.parse(JSON.stringify(data)), expected);

  console.log('test passed');

  knex.destroy();
})();