import { execute, parse, printSchema, subscribe } from 'graphql';
import * as relay from '../src/relay';
import { Gql } from '../src/define';
import { InterfaceType } from '../src/types';
import { buildGraphQLSchema } from '../src/build';

declare module '../src/types' {
  interface GqlContext {
    contextContent: string;
  }
}

test('can build a schema', async () => {
  enum Episode {
    NEWHOPE = 4,
    EMPIRE = 5,
    JEDI = 6,
  }

  type Human = {
    type: 'Human';
    id: string;
    name: string;
    appearsIn: Array<Episode>;
    homePlanet: string | null;
    friends: Array<string>;
  };

  type Droid = {
    type: 'Droid';
    id: string;
    name: string;
    appearsIn: Array<Episode>;
    primaryFunction: string;
    friends: Array<string>;
  };

  type Character = Human | Droid;

  const luke: Human = {
    // @ts-expect-error
    __typename: 'Human',
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
  function getCharacter(id: string): null | Character {
    return humanData[id] ?? droidData[id] ?? null;
  }

  function getFriends(character: Character): Array<Character | null> {
    return character.friends.map((id) => getCharacter(id));
  }

  function getHero(episode: Episode) {
    if (episode === 5) {
      // Luke is the hero of Episode V.
      return luke;
    }
    // Artoo is the hero otherwise.
    return artoo;
  }

  function getHuman(id: string): Human | null {
    return humanData[id] ?? null;
  }

  function getDroid(id: string): Droid | null {
    return droidData[id] ?? null;
  }

  const { nodeInterface, nodeField } = relay.nodeDefinitions((id) =>
    getCharacter(id)
  );

  const episodeEnum = Gql.Enum({
    name: 'Episode',
    description: 'One of the films in the Star Wars Trilogy',
    values: [
      { name: 'NEWHOPE', value: Episode.NEWHOPE },
      { name: 'EMPIRE', value: Episode.EMPIRE },
      { name: 'JEDI', value: Episode.JEDI },
    ],
  });

  const characterInterface: InterfaceType<Character | null> =
    Gql.InterfaceType<Character>({
      name: 'Character',
      interfaces: [],
      fields: () => [
        Gql.AbstractField({ name: 'id', type: Gql.NonNull(Gql.ID) }),
        Gql.AbstractField({ name: 'name', type: Gql.NonNull(Gql.String) }),
        Gql.AbstractField({
          name: 'appearsIn',
          type: Gql.NonNull(Gql.List(Gql.NonNull(episodeEnum))),
        }),
        Gql.AbstractField({
          name: 'friends',
          type: characterConnectionType,
          args: {
            first: Gql.Arg({ type: Gql.Int }),
            after: Gql.Arg({ type: Gql.String }),
          },
        }),
      ],
    });

  const { connectionType: characterConnectionType } =
    relay.connectionDefinitions<Character>({
      nodeType: characterInterface,
      edgeFields: () => [
        Gql.Field({
          name: 'friendshipTime',
          type: Gql.String,
          resolve: (_edge) => {
            return 'Yesterday';
          },
        }),
      ],
      connectionFields: () => [
        Gql.Field({
          name: 'totalCount',
          type: Gql.Int,
          resolve: () => {
            return (
              Object.keys(humanData).length + Object.keys(droidData).length
            );
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

  const humanType = Gql.Object<Human>({
    name: 'Human',
    description: 'A humanoid creature in the Star Wars universe.',
    interfaces: [nodeInterface, characterInterface],
    isTypeOf: (thing) => thing.type === 'Human',
    fields: () => [
      Gql.Field({ name: 'id', type: Gql.NonNull(Gql.ID) }),
      Gql.Field({ name: 'name', type: Gql.NonNull(Gql.String) }),
      Gql.Field({
        name: 'appearsIn',
        type: Gql.NonNull(Gql.List(Gql.NonNull(episodeEnum))),
      }),
      Gql.Field({ name: 'homePlanet', type: Gql.String }),
      Gql.Field({
        name: 'friends',
        type: characterConnectionType,
        args: relay.connectionArgs,
        resolve: async (c, args) => {
          const friends = await Promise.all(getFriends(c));
          return createConnectionFromCharacterArray(
            friends.filter(isSome),
            args
          );
        },
      }),
      Gql.Field({
        name: 'secretBackStory',
        type: Gql.String,
        resolve: () => {
          throw new Error('secretBackstory is secret');
        },
      }),
    ],
  });

  const droidType = Gql.Object<Droid>({
    name: 'Droid',
    description: 'A mechanical creature in the Star Wars universe.',
    interfaces: [nodeInterface, characterInterface],
    isTypeOf: (thing) => thing.type === 'Droid',
    fields: () => [
      Gql.Field({ name: 'id', type: Gql.NonNull(Gql.ID) }),
      Gql.Field({ name: 'name', type: Gql.NonNull(Gql.String) }),
      Gql.Field({
        name: 'appearsIn',
        type: Gql.NonNull(Gql.List(Gql.NonNull(episodeEnum))),
      }),
      Gql.Field({ name: 'primaryFunction', type: Gql.NonNull(Gql.String) }),
      Gql.Field({
        name: 'friends',
        type: characterConnectionType,
        args: relay.connectionArgs,
        resolve: async (c, args) => {
          const friends = await Promise.all(getFriends(c));
          return createConnectionFromCharacterArray(
            friends.filter(isSome),
            args
          );
        },
      }),
      Gql.Field({
        name: 'secretBackStory',
        type: Gql.String,
        resolve: () => {
          throw new Error('secretBackstory is secret');
        },
      }),
    ],
  });

  const searchResultType = Gql.Union<Droid | Human>({
    name: 'SearchResult',
    description: 'Either droid or human',
    resolveType: (src) => {
      switch (src.type) {
        case 'Droid':
          return droidType.name;
        case 'Human':
          return humanType.name;
      }
    },
    types: [humanType, droidType],
  });

  const humanInputType = Gql.InputObject({
    name: 'HumanInput',
    description: 'I just want to test input types',
    fields: () => ({
      unused: { type: Gql.NonNullInput(Gql.String) },
    }),
  });

  const query = Gql.Query({
    fields: () => [
      nodeField,
      Gql.Field({
        name: 'hero',
        type: characterInterface,
        args: {
          episode: Gql.DefaultArg(episodeEnum, Episode.EMPIRE),
        },
        resolve: (_, { episode }) => getHero(episode),
      }),
      Gql.Field({
        name: 'human',
        type: humanType,
        args: { id: Gql.Arg({ type: Gql.NonNullInput(Gql.ID) }) },
        resolve: (_, { id }) => getHuman(id),
      }),
      Gql.Field({
        name: 'droid',
        type: droidType,
        args: {
          id: Gql.Arg({
            type: Gql.NonNullInput(Gql.String),
            description: 'ID of the droid',
          }),
        },
        resolve: (_, { id }) => getDroid(id),
      }),
      Gql.Field({
        name: 'contextContent',
        type: Gql.String,
        resolve: (_, _args, ctx) => ctx.contextContent,
      }),
      Gql.Field({
        name: 'search',
        type: Gql.List(searchResultType),
        args: {
          human: Gql.Arg({ type: humanInputType }),
        },
        resolve: () => [
          ...Object.values(humanData),
          ...Object.values(droidData),
        ],
      }),
    ],
  });

  const schema = buildGraphQLSchema({
    query,
  });

  const printed = printSchema(schema);

  expect(printed).toMatchInlineSnapshot(`
    "type Query {
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
      node: Character

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
    }"
  `);

  const result = await execute({
    schema,
    document: parse(/* GraphQL */ `
      query {
        node(id: "1000") {
          __typename
        }

        luke: human(id: "1000") {
          __typename
          name
        }
        hero {
          __typename
          name
          friends {
            pageInfo {
              endCursor
              startCursor
              hasNextPage
              hasPreviousPage
            }
            edges {
              cursor
              node {
                name
                appearsIn
              }
            }
          }
        }
      }
    `),
  });

  expect(result).toMatchInlineSnapshot(`
    {
      "data": {
        "hero": {
          "__typename": "Human",
          "friends": {
            "edges": [
              {
                "cursor": "1002",
                "node": {
                  "appearsIn": [
                    "NEWHOPE",
                    "EMPIRE",
                    "JEDI",
                  ],
                  "name": "Han Solo",
                },
              },
              {
                "cursor": "1003",
                "node": {
                  "appearsIn": [
                    "NEWHOPE",
                    "EMPIRE",
                    "JEDI",
                  ],
                  "name": "Leia Organa",
                },
              },
              {
                "cursor": "2000",
                "node": {
                  "appearsIn": [
                    "NEWHOPE",
                    "EMPIRE",
                    "JEDI",
                  ],
                  "name": "C-3PO",
                },
              },
              {
                "cursor": "2001",
                "node": {
                  "appearsIn": [
                    "NEWHOPE",
                    "EMPIRE",
                    "JEDI",
                  ],
                  "name": "R2-D2",
                },
              },
            ],
            "pageInfo": {
              "endCursor": "2001",
              "hasNextPage": false,
              "hasPreviousPage": false,
              "startCursor": "1002",
            },
          },
          "name": "Luke Skywalker",
        },
        "luke": {
          "__typename": "Human",
          "name": "Luke Skywalker",
        },
        "node": {
          "__typename": "Human",
        },
      },
    }
  `);
});

test('Subscription work properly', async () => {
  const GraphQLSubscriptionObject = Gql.Subscription({
    name: 'Subscription',
    fields: () => [
      Gql.SubscriptionField({
        name: 'greetings',
        type: Gql.NonNull(Gql.String),
        subscribe: async function* () {
          for (const greeting of ['hi', 'ola', 'sup', 'hello']) {
            yield greeting;
          }
        },
      }),
    ],
  });

  const schema = buildGraphQLSchema({
    query: Gql.Query({
      name: 'Query',
      fields: () => [
        Gql.Field({ name: '_', type: Gql.Boolean, resolve: () => null }),
      ],
    }),
    subscription: GraphQLSubscriptionObject,
  });

  const result = await subscribe({
    schema,
    document: parse(/* GraphQL */ `
      subscription {
        greetings
      }
    `),
  });
  assertAsyncIterable(result);

  const values: Array<any> = [];
  for await (const value of result) {
    values.push(value);
  }
  expect(values).toMatchInlineSnapshot(`
    [
      {
        "data": {
          "greetings": "hi",
        },
      },
      {
        "data": {
          "greetings": "ola",
        },
      },
      {
        "data": {
          "greetings": "sup",
        },
      },
      {
        "data": {
          "greetings": "hello",
        },
      },
    ]
  `);
});

function assertAsyncIterable(
  input: object
): asserts input is AsyncIterableIterator<any> {
  if (Symbol.asyncIterator in input) {
    return;
  }
  throw new Error('Expected AsyncIterable.');
}
