import * as t from '../src/define';
import { buildGraphQLSchema } from '../src/build';

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

type Human = {
  type: 'Human';
  id: string;
  name: string;
  friends: Array<string>;
  appearsIn: Array<Episode>;
  homePlanet: string | null;
  __typename: 'Human';
};

type Droid = {
  type: 'Droid';
  id: string;
  name: string;
  friends: Array<string>;
  appearsIn: Array<Episode>;
  primaryFunction: string;
  __typename: 'Droid';
};

const luke: Human = {
  type: 'Human',
  id: '1000',
  name: 'Luke Skywalker',
  friends: ['1002', '1003', '2000', '2001'],
  appearsIn: [4, 5, 6],
  homePlanet: 'Tatooine',
  __typename: 'Human',
};

const vader: Human = {
  type: 'Human',
  id: '1001',
  name: 'Darth Vader',
  friends: ['1004'],
  appearsIn: [4, 5, 6],
  homePlanet: 'Tatooine',
  __typename: 'Human',
};

const han: Human = {
  type: 'Human',
  id: '1002',
  name: 'Han Solo',
  friends: ['1000', '1003', '2001'],
  appearsIn: [4, 5, 6],
  homePlanet: null,
  __typename: 'Human',
};

const leia: Human = {
  type: 'Human',
  id: '1003',
  name: 'Leia Organa',
  friends: ['1000', '1002', '2000', '2001'],
  appearsIn: [4, 5, 6],
  homePlanet: 'Alderaan',
  __typename: 'Human',
};

const tarkin: Human = {
  type: 'Human',
  id: '1004',
  name: 'Wilhuff Tarkin',
  friends: ['1001'],
  appearsIn: [4],
  homePlanet: null,
  __typename: 'Human',
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
  __typename: 'Droid',
};

const artoo: Droid = {
  type: 'Droid',
  id: '2001',
  name: 'R2-D2',
  friends: ['1000', '1002', '1003'],
  appearsIn: [4, 5, 6],
  primaryFunction: 'Astromech',
  __typename: 'Droid',
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

const episodeEnum = t.enumType({
  name: 'Episode',
  description: 'One of the films in the Star Wars Trilogy',
  values: [
    { name: 'NEWHOPE', value: Episode.NEWHOPE },
    { name: 'EMPIRE', value: Episode.EMPIRE },
    { name: 'JEDI', value: Episode.JEDI },
  ],
});

const characterInterface = t.interfaceType<ICharacter>('Character', {
  fields: self => [
    t.abstractField('id', t.NonNull(t.StringType)),
    t.abstractField('name', t.NonNull(t.StringType)),
    t.abstractField('appearsIn', t.NonNull(t.List(t.NonNull(episodeEnum)))),
    t.abstractField('friends', t.NonNull(t.List(self))),
  ],
});

const humanType = t.objectType<Human>('Human', {
  description: 'A humanoid creature in the Star Wars universe.',
  interfaces: [characterInterface],
  fields: () => [
    t.fieldFast('id', t.NonNull(t.StringIDType)),
    t.fieldFast('name', t.NonNull(t.StringType)),
    t.fieldFast('appearsIn', t.NonNull(t.List(t.NonNull(episodeEnum)))),
    t.fieldFast('homePlanet', t.StringType),
    t.field({
      name: 'friends',
      type: t.NonNull(t.List(characterInterface)),
      resolve: c => {
        return Promise.all(getFriends(c));
      },
    }),
    t.field({
      name: 'secretBackStory',
      type: t.StringType,
      resolve: () => {
        throw new Error('secretBackstory is secret');
      },
    }),
  ],
});

const droidType = t.objectType<Droid>('Droid', {
  description: 'A mechanical creature in the Star Wars universe.',
  interfaces: [characterInterface],
  fields: () => [
    t.fieldFast('id', t.NonNull(t.StringIDType)),
    t.fieldFast('name', t.NonNull(t.StringType)),
    t.fieldFast('appearsIn', t.NonNull(t.List(t.NonNull(episodeEnum)))),
    t.fieldFast('primaryFunction', t.NonNull(t.StringType)),
    t.field({
      name: 'friends',
      type: t.NonNull(t.List(characterInterface)),
      resolve: c => {
        return Promise.all(getFriends(c));
      },
    }),
    t.field({
      name: 'secretBackStory',
      type: t.StringType,
      resolve: () => {
        throw new Error('secretBackstory is secret');
      },
    }),
  ],
});

const queryType = t.queryType({
  fields: () => [
    t.field({
      name: 'hero',
      type: characterInterface,
      args: {
        episode: { type: episodeEnum },
      },
      resolve: (_, { episode }) => getHero(episode),
    }),
    t.field({
      name: 'human',
      type: humanType,
      args: { id: { type: t.NonNullInput(t.StringType) } },
      resolve: (_, { id }) => getHuman(id),
    }),
    t.field({
      name: 'droid',
      type: droidType,
      args: {
        id: { type: t.NonNullInput(t.StringType), description: 'id of the droid' },
      },
      resolve: (_, { id }) => getDroid(id),
    }),
  ],
});

const schema = {
  query: queryType,
};

import express from 'express';
import graphqlHTTP from 'express-graphql';

const app = express();

app.use(
  '/graphql',
  graphqlHTTP({
    schema: buildGraphQLSchema(schema),
    graphiql: true,
  })
);

app.listen(4000);
