import assert from 'assert/strict';

import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLString,
  GraphQLID,
} from 'graphql';

import { nodeDefinitions, fromGlobalId, globalIdField } from 'graphql-relay';

import pkg from 'join-monster';
const joinMonster = pkg.default;

import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// modifiy here if you want to use another database
const dbExec = (sql) => {
  console.log("SQL: " + sql);
  return [{
    id: 'efcd2a70-63a2-4ad3-a669-dcabc6238f2c',
    name: 'Test User',
  }]
}

// begin your definition of the schema
const { nodeInterface, nodeField } = nodeDefinitions(
  // https://join-monster.readthedocs.io/en/v0.9.9/relay/
  // resolve the ID to an object
  (globalId, context, resolveInfo) => {
    // parse the globalID
    const { type, id } = fromGlobalId(globalId)

    // pass the type name and other info. `joinMonster` will find the type from the name and write the SQL
    return joinMonster.getNode(type, resolveInfo, context, [id],
      async sql => dbExec(sql)
    )
  },
  // determines the type. Join Monster places that type onto the result object on the "__type__" property
  obj => obj.__type__?.name
)

const User = new GraphQLObjectType({
  name: 'User',
  sqlTable: 'public.user',
  interfaces: [nodeInterface],
  description: 'User model',
  extensions: {
    joinMonster: {
      sqlTable: 'public.user',
      uniqueKey: 'id'
    }
  },
  fields: () => {
    return {
      id: { ...globalIdField(), },
      name: { type: GraphQLString },
    }
  },
});
// end your definition of the schema

const QueryRoot = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    node: nodeField,
    user: {
      type: User,
      description: "get user information",
      args: {
        id: { type: GraphQLID }
      },
      resolve: async (parent, args, context, resolveInfo) => {
        return await joinMonster(resolveInfo, context, async sql => {
          return dbExec(sql);
        });
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
  query {
    node(id:"VXNlcjplZmNkMmE3MC02M2EyLTRhZDMtYTY2OS1kY2FiYzYyMzhmMmM=") {
      id
    }
  }
  `;

  // define the expected result
  const expected = {
    id: 'efcd2a70-63a2-4ad3-a669-dcabc6238f2c',
    name: 'Test User',
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