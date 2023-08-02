import type { Interface } from '../src';
import type { Connection, ConnectionArguments, Edge } from '../src/relay';
import {
  GqlID,
  GqlInt,
  GqlString,
  GqlBoolean,
  List,
  NonNull,
  NonNullInput,
  InterfaceType,
  AbstractField,
  Field,
  ObjectType,
  QueryType,
  DefaultArg,
  Arg,
  buildGraphQLSchema,
  EnumType,
} from '../src';
import {
  connectionArgs,
  connectionDefinitions,
  nodeDefinitions,
} from '../src/relay';
import express = require('express');
import graphqlHTTP = require('express-graphql');

declare module '../src/types' {
  interface Ctx {
    contextContent: string;
  }
}

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
  optionalField?: string;
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
  return character.friends.map(id => getCharacter(id));
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

const { nodeInterface, nodeField } = nodeDefinitions(NonNull(GqlID) => getCharacterNonNull(GqlID));

const episodeEnum = EnumType({
  name: 'Episode',
  description: 'One of the films in the Star Wars Trilogy',
  values: [
    { name: 'NEWHOPE', value: Episode.NEWHOPE },
    { name: 'EMPIRE', value: Episode.EMPIRE },
    { name: 'JEDI', value: Episode.JEDI },
  ],
});

const characterInterface: Interface<ICharacter | null | undefined> =
  InterfaceType<ICharacter>({
    name: 'Character',
    interfaces: [],
    fields: () => [
      AbstractField({ name: 'id', type: NonNull(GqlID) }),
      AbstractField({ name: 'name', type: NonNull(GqlString) }),
      AbstractField({
        name: 'appearsIn',
        type: NonNull(List(NonNull(episodeEnum))),
      }),
      AbstractField({ name: 'friends', type: characterConnectionType }),
    ],
  });

const { connectionType: characterConnectionType } =
  connectionDefinitions<ICharacter>({
    nodeType: characterInterface,
    edgeFields: () => [
      Field({
        name: 'friendshipTime',
        type: GqlString,
        resolve: (_edge: Edge<ICharacter>) => {
          return 'Yesterday';
        },
      }),
    ],
    connectionFields: () => [
      Field({
        name: 'totalCount',
        type: GqlInt,
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

const humanType = ObjectType<Human>({
  name: 'Human',
  description: 'A humanoid creature in the Star Wars universe.',
  interfaces: [nodeInterface, characterInterface],
  isTypeOf: (thing: ICharacter) => thing.type === 'Human',
  fields: () => [
    Field({
      name: 'id',
      type: NonNull(GqlID),
    }),
    Field({
      name: 'name',
      type: NonNull(GqlString),
    }),
    Field({
      name: 'appearsIn',
      type: NonNull(List(NonNull(episodeEnum))),
    }),
    Field({
      name: 'homePlanet',
      type: GqlString,
    }),
    Field({
      name: 'friends',
      type: characterConnectionType,
      args: connectionArgs,
      resolve: async (c, args, ctx) => {
        const friends = await Promise.all(getFriends(c));
        return createConnectionFromCharacterArray(friends, args);
      },
    }),
    Field({
      name: 'secretBackStory',
      type: GqlString,
      resolve: () => {
        throw new Error('secretBackstory is secret');
      },
    }),
    Field({
      name: 'optionalField',
      type: GqlString,
    }),
  ],
});

const droidType = ObjectType<Droid>({
  name: 'Droid',
  description: 'A mechanical creature in the Star Wars universe.',
  interfaces: [nodeInterface, characterInterface],
  isTypeOf: (thing: ICharacter) => thing.type === 'Droid',
  fields: () => [
    Field({
      name: 'id',
      type: NonNull(GqlID),
    }),
    Field({
      name: 'name',
      type: NonNull(GqlString),
    }),
    Field({
      name: 'appearsIn',
      type: NonNull(List(NonNull(episodeEnum))),
    }),
    Field({
      name: 'primaryFunction',
      type: NonNull(GqlString),
    }),
    Field({
      name: 'friends',
      type: characterConnectionType,
      args: connectionArgs,
      resolve: async (c, args) => {
        const friends = await Promise.all(getFriends(c));
        return createConnectionFromCharacterArray(friends, args);
      },
    }),
    Field({
      name: 'secretBackStory',
      type: GqlString,
      resolve: () => {
        throw new Error('secretBackstory is secret');
      },
    }),
  ],
});

const query = QueryType({
  fields: () => [
    nodeField,
    Field({
      name: 'hero',
      type: characterInterface,
      args: {
        episode: DefaultArg(episodeEnum, Episode.EMPIRE),
      },
      resolve: (_, { episode }) => getHero(episode),
    }),
    Field({
      name: 'human',
      type: humanType,
      args: { id: Arg(NonNullInput(GqlID)) },
      resolve: (_, { id }) => getHuman(id),
    }),
    Field({
      name: 'droid',
      type: droidType,
      args: {
        id: Arg(NonNullInput(GqlString), 'ID of the droid'),
      },
      resolve: (_, { id }) => getDroid(id),
    }),
    Field({
      name: 'contextContent',
      type: GqlString,
      resolve: (_, _args, ctx) => ctx.contextContent,
    }),
  ],
});

const schema = {
  query: query,
};

const app = express();

app.use(
  '/graphql',
  // @ts-expect-error type inconsistencies...
  graphqlHTTP({
    schema: buildGraphQLSchema(schema),
    graphiql: true,
  })
);

app.listen(4000, () => {
  console.log(`Listening on http://localhost:4000/graphql`);
});
