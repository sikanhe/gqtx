import * as assert from "assert";
import { printSchema } from "graphql";
import {
  createTypesFactory,
  buildGraphQLSchema,
  Interface,
} from "../src/index";
import { createRelayHelpers } from "../src/relay";

type Context = {
  contextContent: string;
};

const t = createTypesFactory<Context>();
const relay = createRelayHelpers(t);

enum Episode {
  NEWHOPE = 4,
  EMPIRE = 5,
  JEDI = 6,
}

type Human = {
  type: "Human";
  id: string;
  name: string;
  appearsIn: Array<Episode>;
  homePlanet: string | null;
  friends: Array<string>;
};

type Droid = {
  type: "Droid";
  id: string;
  name: string;
  appearsIn: Array<Episode>;
  primaryFunction: string;
  friends: Array<string>;
};

type Character = Human | Droid;

const luke: Human = {
  type: "Human",
  id: "1000",
  name: "Luke Skywalker",
  friends: ["1002", "1003", "2000", "2001"],
  appearsIn: [4, 5, 6],
  homePlanet: "Tatooine",
};

const vader: Human = {
  type: "Human",
  id: "1001",
  name: "Darth Vader",
  friends: ["1004"],
  appearsIn: [4, 5, 6],
  homePlanet: "Tatooine",
};

const han: Human = {
  type: "Human",
  id: "1002",
  name: "Han Solo",
  friends: ["1000", "1003", "2001"],
  appearsIn: [4, 5, 6],
  homePlanet: null,
};

const leia: Human = {
  type: "Human",
  id: "1003",
  name: "Leia Organa",
  friends: ["1000", "1002", "2000", "2001"],
  appearsIn: [4, 5, 6],
  homePlanet: "Alderaan",
};

const tarkin: Human = {
  type: "Human",
  id: "1004",
  name: "Wilhuff Tarkin",
  friends: ["1001"],
  appearsIn: [4],
  homePlanet: null,
};

const humanData: Record<string, Human> = {
  "1000": luke,
  "1001": vader,
  "1002": han,
  "1003": leia,
  "1004": tarkin,
};

const threepio: Droid = {
  type: "Droid",
  id: "2000",
  name: "C-3PO",
  friends: ["1000", "1002", "1003", "2001"],
  appearsIn: [4, 5, 6],
  primaryFunction: "Protocol",
};

const artoo: Droid = {
  type: "Droid",
  id: "2001",
  name: "R2-D2",
  friends: ["1000", "1002", "1003"],
  appearsIn: [4, 5, 6],
  primaryFunction: "Astromech",
};

const droidData: Record<string, Droid> = {
  "2000": threepio,
  "2001": artoo,
};
function getCharacter(id: string): null | Character {
  return humanData[id] ?? droidData[id] ?? null;
}

export function getFriends(character: Character): Array<Character | null> {
  return character.friends.map((id) => getCharacter(id));
}

export function getHero(episode: Episode) {
  if (episode === 5) {
    // Luke is the hero of Episode V.
    return luke;
  }
  // Artoo is the hero otherwise.
  return artoo;
}

export function getHuman(id: string): Human | null {
  return humanData[id] ?? null;
}

export function getDroid(id: string): Droid | null {
  return droidData[id] ?? null;
}

const { nodeInterface, nodeField } = relay.nodeDefinitions((id) =>
  getCharacter(id)
);

const episodeEnum = t.enumType({
  name: "Episode",
  description: "One of the films in the Star Wars Trilogy",
  values: [
    { name: "NEWHOPE", value: Episode.NEWHOPE },
    { name: "EMPIRE", value: Episode.EMPIRE },
    { name: "JEDI", value: Episode.JEDI },
  ],
});

const characterInterface: Interface<Context, Character | null> = t.interfaceType<Character>({
  name: "Character",
  interfaces: [],
  fields: () => [
    t.abstractField("id", t.NonNull(t.ID)),
    t.abstractField("name", t.NonNull(t.String)),
    t.abstractField("appearsIn", t.NonNull(t.List(t.NonNull(episodeEnum)))),
    t.abstractField("friends", characterConnectionType, {
      args: {
        first: t.arg(t.Int),
        after: t.arg(t.String),
      },
    }),
  ],
});

const { connectionType: characterConnectionType } = relay.connectionDefinitions<Character>(
  {
    nodeType: characterInterface,
    edgeFields: () => [
      t.field({
        name: "friendshipTime",
        type: t.String,
        resolve: (_edge) => {
          return "Yesterday";
        },
      }),
    ],
    connectionFields: () => [
      t.field({
        name: "totalCount",
        type: t.Int,
        resolve: () => {
          return Object.keys(humanData).length + Object.keys(droidData).length;
        },
      }),
    ],
  });

const createConnectionFromCharacterArray = (
  array: Array<Character>,
  args: any
) => {
  let sliceStart = 0;
  let sliceEnd = array.length;

  if (args.after) {
    const idx = array.findIndex((c) => c?.id === args.after);
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

function isSome<T>(input: T): input is Exclude<T, null | undefined> {
  return input != null;
}

const humanType = t.objectType<Human>({
  name: "Human",
  description: "A humanoid creature in the Star Wars universe.",
  interfaces: [nodeInterface, characterInterface],
  isTypeOf: (thing) => thing.type === "Human",
  fields: () => [
    t.field({ name: "id", type: t.NonNull(t.ID) }),
    t.field({ name: "name", type: t.NonNull(t.String) }),
    t.field({
      name: "appearsIn",
      type: t.NonNull(t.List(t.NonNull(episodeEnum))),
    }),
    t.field({ name: "homePlanet", type: t.String }),
    t.field({
      name: "friends",
      type: characterConnectionType,
      args: relay.connectionArgs,
      resolve: async (c, args) => {
        const friends = await Promise.all(getFriends(c));
        return createConnectionFromCharacterArray(friends.filter(isSome), args);
      },
    }),
    t.field({
      name: "secretBackStory",
      type: t.String,
      resolve: () => {
        throw new Error("secretBackstory is secret");
      },
    }),
  ],
});

const droidType = t.objectType<Droid>({
  name: "Droid",
  description: "A mechanical creature in the Star Wars universe.",
  interfaces: [nodeInterface, characterInterface],
  isTypeOf: (thing) => thing.type === "Droid",
  fields: () => [
    t.field({ name: "id", type: t.NonNull(t.ID) }),
    t.field({ name: "name", type: t.NonNull(t.String) }),
    t.field({
      name: "appearsIn",
      type: t.NonNull(t.List(t.NonNull(episodeEnum))),
    }),
    t.field({ name: "primaryFunction", type: t.NonNull(t.String) }),
    t.field({
      name: "friends",
      type: characterConnectionType,
      args: relay.connectionArgs,
      resolve: async (c, args) => {
        const friends = await Promise.all(getFriends(c));
        return createConnectionFromCharacterArray(friends.filter(isSome), args);
      },
    }),
    t.field({
      name: "secretBackStory",
      type: t.String,
      resolve: () => {
        throw new Error("secretBackstory is secret");
      },
    }),
  ],
});

const searchResultType = t.unionType<Droid | Human>({
  name: "SearchResult",
  description: "Either droid or human",
  resolveType: (src) => {
    switch (src.type) {
      case "Droid":
        return droidType;
      case "Human":
        return humanType;
    }
  },
  types: [humanType, droidType],
});

const humanInputType = t.inputObjectType({
  name: "HumanInput",
  description: "I just want to test input types",
  fields: () => ({
    unused: { type: t.NonNullInput(t.String) },
  }),
});

const queryType = t.queryType({
  fields: () => [
    nodeField,
    t.field({
      name: "hero",
      type: characterInterface,
      args: {
        episode: t.defaultArg(episodeEnum, Episode.EMPIRE),
      },
      resolve: (_, { episode }) => getHero(episode),
    }),
    t.field({
      name: "human",
      type: humanType,
      args: { id: t.arg(t.NonNullInput(t.ID)) },
      resolve: (_, { id }) => getHuman(id),
    }),
    t.field({
      name: "droid",
      type: droidType,
      args: {
        id: t.arg(t.NonNullInput(t.String), "ID of the droid"),
      },
      resolve: (_, { id }) => getDroid(id),
    }),
    t.field({
      name: "contextContent",
      type: t.String,
      resolve: (_, _args, ctx) => ctx.contextContent,
    }),
    t.field({
      name: "search",
      type: t.List(searchResultType),
      args: {
        human: t.arg(humanInputType),
      },
      resolve: () => [...Object.values(humanData), ...Object.values(droidData)],
    }),
  ],
});

const schema = buildGraphQLSchema({
  query: queryType,
});

const printed = printSchema(schema);

const expected = `type Query {
  node(
    """The ID of an object"""
    id: ID!
  ): Node
  hero(episode: Episode = EMPIRE): Character
  human(id: ID!): Human
  droid(
    """ID of the droid"""
    id: String!
  ): Droid
  contextContent: String
  search(human: HumanInput): [SearchResult]
}

"""An object with an ID"""
interface Node {
  """The id of the object."""
  id: ID!
}

interface Character {
  id: ID!
  name: String!
  appearsIn: [Episode!]!
  friends(first: Int, after: String): CharacterConnection
}

"""One of the films in the Star Wars Trilogy"""
enum Episode {
  NEWHOPE
  EMPIRE
  JEDI
}

"""A connection to a list of items."""
type CharacterConnection {
  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """A list of edges."""
  edges: [CharacterEdge]
  totalCount: Int
}

"""Information about pagination in a connection."""
type PageInfo {
  """When paginating forwards, are there more items?"""
  hasNextPage: Boolean!

  """When paginating backwards, are there more items?"""
  hasPreviousPage: Boolean!

  """When paginating backwards, the cursor to continue."""
  startCursor: String

  """When paginating forwards, the cursor to continue."""
  endCursor: String
}

"""An edge in a connection."""
type CharacterEdge {
  """The item at the end of the edge"""
  node: Character!

  """A cursor for use in pagination"""
  cursor: String!
  friendshipTime: String
}

"""A humanoid creature in the Star Wars universe."""
type Human implements Node & Character {
  id: ID!
  name: String!
  appearsIn: [Episode!]!
  homePlanet: String
  friends(after: String, first: Int, before: String, last: Int): CharacterConnection
  secretBackStory: String
}

"""A mechanical creature in the Star Wars universe."""
type Droid implements Node & Character {
  id: ID!
  name: String!
  appearsIn: [Episode!]!
  primaryFunction: String!
  friends(after: String, first: Int, before: String, last: Int): CharacterConnection
  secretBackStory: String
}

"""Either droid or human"""
union SearchResult = Human | Droid

"""I just want to test input types"""
input HumanInput {
  unused: String!
}
`;

assert.strictEqual(printed, expected);
