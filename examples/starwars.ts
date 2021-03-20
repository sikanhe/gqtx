import type { Interface } from '../src';
import type { Connection, ConnectionArguments, Edge } from '../src/relay';
import { createTypesFactory, buildGraphQLSchema } from '../src';
import { createRelayHelpers } from '../src/relay';
import express = require('express');
import graphqlHTTP = require('express-graphql');

type Context = { contextContent: string };

const t = createTypesFactory<Context>();
const relay = createRelayHelpers(t);

const enum Episode {
  NEWHOPE = 4,
  EMPIRE = 5,
  JEDI = 6,
}

type ICharacter = {
  type: 'Human' | 'Droid';
  id: string;
  name: string;
  friends: Array<string>;
  appearsIn: Array<Episode>;
};

type Human = ICharacter & {
  type: 'Human';
  homePlanet: string | null;
};

type Droid = ICharacter & {
  type: 'Droid';
  primaryFunction: string;
};

const luke: Human = {
  type: 'Human',
  id: '1000',
  name: 'Luke Skywalker',
  friends: ['1002', '1003', '2000', '2001'],
  appearsIn: [4, 5, 6],
  homePlanet: 'Tatooine',
};

const vader: Human = {
  type: 'Human',
  id: '1001',
  name: 'Darth Vader',
  friends: ['1004'],
  appearsIn: [4, 5, 6],
  homePlanet: 'Tatooine',
};

const han: Human = {
  type: 'Human',
  id: '1002',
  name: 'Han Solo',
  friends: ['1000', '1003', '2001'],
  appearsIn: [4, 5, 6],
  homePlanet: null,
};

const leia: Human = {
  type: 'Human',
  id: '1003',
  name: 'Leia Organa',
  friends: ['1000', '1002', '2000', '2001'],
  appearsIn: [4, 5, 6],
  homePlanet: 'Alderaan',
  // __typename: 'Human',
};

const tarkin: Human = {
  type: 'Human',
  id: '1004',
  name: 'Wilhuff Tarkin',
  friends: ['1001'],
  appearsIn: [4],
  homePlanet: null,
};

const humanData: Record<string, Human> = {
  '1000': luke,
  '1001': vader,
  '1002': han,
  '1003': leia,
  '1004': tarkin,
};

const threepio: Droid = {
  type: 'Droid',
  id: '2000',
  name: 'C-3PO',
  friends: ['1000', '1002', '1003', '2001'],
  appearsIn: [4, 5, 6],
  primaryFunction: 'Protocol',
};

const artoo: Droid = {
  type: 'Droid',
  id: '2001',
  name: 'R2-D2',
  friends: ['1000', '1002', '1003'],
  appearsIn: [4, 5, 6],
  primaryFunction: 'Astromech',
};

const droidData: Record<string, Droid> = {
  '2000': threepio,
  '2001': artoo,
};
function getCharacter(id: string) {
  return Promise.resolve(humanData[id] || droidData[id]);
}

export function getFriends(character: ICharacter): Array<Promise<ICharacter>> {
  return character.friends.map((id) => getCharacter(id));
}

export function getHero(episode: Episode | null): ICharacter {
  if (episode === 5) {
    // Luke is the hero of Episode V.
    return luke;
  }
  // Artoo is the hero otherwise.
  return artoo;
}

export function getHuman(id: string): Human {
  return humanData[id];
}

export function getDroid(id: string): Droid {
  return droidData[id];
}

const { nodeInterface, nodeField } = relay.nodeDefinitions((id) => getCharacter(id));

const episodeEnum = t.enumType({
  name: 'Episode',
  description: 'One of the films in the Star Wars Trilogy',
  values: [
    { name: 'NEWHOPE', value: Episode.NEWHOPE },
    { name: 'EMPIRE', value: Episode.EMPIRE },
    { name: 'JEDI', value: Episode.JEDI },
  ],
});

const characterInterface: Interface<Context, ICharacter | null> = t.interfaceType<ICharacter>({
  name: 'Character',
  interfaces: [],
  fields: () => [
    t.abstractField('id', t.NonNull(t.ID)),
    t.abstractField('name', t.NonNull(t.String)),
    t.abstractField('appearsIn', t.NonNull(t.List(t.NonNull(episodeEnum)))),
    t.abstractField('friends', characterConnectionType),
  ],
});

const { connectionType: characterConnectionType } = relay.connectionDefinitions<ICharacter>({
  nodeType: characterInterface,
  edgeFields: () => [
    t.field('friendshipTime', t.String, {
      resolve: (_edge: Edge<ICharacter>) => {
        return 'Yesterday';
      },
    }),
  ],
  connectionFields: () => [
    t.field('totalCount', t.Int, {
      resolve: () => {
        return Object.keys(humanData).length + Object.keys(droidData).length;
      },
    }),
  ],
});

const createConnectionFromCharacterArray = (
  array: ICharacter[],
  args: ConnectionArguments
): Connection<ICharacter> => {
  let sliceStart = 0;
  let sliceEnd = array.length;

  if (args.after) {
    const idx = array.findIndex((c) => c.id === args.after);
    if (idx > -1) {
      sliceStart = idx;
    }
  }

  if (args.first) {
    sliceEnd = Math.min(sliceStart + args.first, array.length);
  }

  if (args.before) {
    sliceStart = array.length;
    const idx = array.findIndex((c) => c.id === args.before);
    if (sliceEnd > -1) {
      sliceEnd = idx;
    }
  }

  if (args.last) {
    sliceStart = Math.max(sliceEnd - args.last, 0);
  }

  return {
    edges: array.slice(sliceStart, sliceEnd).map((char) => ({
      cursor: char.id,
      node: char,
    })),
    pageInfo: {
      endCursor: array[array.length - 1].id,
      hasNextPage: args.first ? array.length >= args.first : false,
      hasPreviousPage: args.last ? array.length >= args.last : false,
      startCursor: array[0].id,
    },
  };
};

const humanType = t.objectType<Human>({
  name: 'Human',
  description: 'A humanoid creature in the Star Wars universe.',
  interfaces: [nodeInterface, characterInterface],
  isTypeOf: (thing: ICharacter) => thing.type === 'Human',
  fields: () => [
    t.field('id', t.NonNull(t.ID)),
    t.field('name', t.NonNull(t.String)),
    t.field('appearsIn', t.NonNull(t.List(t.NonNull(episodeEnum)))),
    t.field('homePlanet', t.String),
    t.field('friends', characterConnectionType, {
      args: relay.connectionArgs,
      resolve: async (c, args) => {
        const friends = await Promise.all(getFriends(c));
        return createConnectionFromCharacterArray(friends, args);
      },
    }),
    t.field('secretBackStory', t.String, {
      resolve: () => {
        throw new Error('secretBackstory is secret');
      },
    }),
  ],
});

const droidType = t.objectType<Droid>({
  name: 'Droid',
  description: 'A mechanical creature in the Star Wars universe.',
  interfaces: [nodeInterface, characterInterface],
  isTypeOf: (thing: ICharacter) => thing.type === 'Droid',
  fields: () => [
    t.field('id', t.NonNull(t.ID)),
    t.field('name', t.NonNull(t.String)),
    t.field('appearsIn', t.NonNull(t.List(t.NonNull(episodeEnum)))),
    t.field('primaryFunction', t.NonNull(t.String)),
    t.field('friends', characterConnectionType, {
      args: relay.connectionArgs,
      resolve: async (c, args) => {
        const friends = await Promise.all(getFriends(c));
        return createConnectionFromCharacterArray(friends, args);
      },
    }),
    t.field('secretBackStory', t.String, {
      resolve: () => {
        throw new Error('secretBackstory is secret');
      },
    }),
  ],
});

const queryType = t.queryType({
  fields: [
    nodeField,
    t.field('hero', characterInterface, {
      args: {
        episode: t.defaultArg(episodeEnum, Episode.EMPIRE),
      },
      resolve: (_, { episode }) => getHero(episode),
    }),
    t.field('human', humanType, {
      args: { id: t.arg(t.NonNullInput(t.ID)) },
      resolve: (_, { id }) => getHuman(id),
    }),
    t.field('droid', droidType, {
      args: {
        id: t.arg(t.NonNullInput(t.String), 'ID of the droid'),
      },
      resolve: (_, { id }) => getDroid(id),
    }),
    t.field('contextContent', t.String, {
      resolve: (_, _args, ctx) => ctx.contextContent,
    }),
  ],
});

const schema = {
  query: queryType,
};

const app = express();

app.use(
  '/graphql',
  graphqlHTTP({
    schema: buildGraphQLSchema(schema),
    graphiql: true,
  })
);

app.listen(4000, () => {
  console.log(`Listening on http://localhost:4000/graphql`)
});
