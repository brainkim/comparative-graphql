import gql from "graphql-tag";
import {RESTDataSource} from "apollo-datasource-rest";
import {makeExecutableSchema} from '@graphql-tools/schema';

class HackerNewsSource extends RESTDataSource {
  constructor() {
    super();
    // TODO: WHY???
    this.initialize({});
    this.baseURL = "https://hacker-news.firebaseio.com/v0/";
  }

  getItem(id) {
    return this.get(`item/${id.toString()}.json`);
  }

  getUser(username) {
    return this.get(`user/${username}.json`);
  }

  getTopStories() {
    return this.get("topstories.json");
  }

  getNewStories() {
    return this.get("newstories.json");
  }

  getBestStories() {
    return this.get("beststories.json");
  }
}

const typeDefs = gql`
# {
#   "about" : "This is a test",
#   "created" : 1173923446,
#   "delay" : 0,
#   "id" : "jl",
#   "karma" : 2937,
#   "submitted" : [ ... ]
# }
type User {
  id: ID!
  username: ID!
  created: Int! #Date!
  karma: Int!
  about: String

  submitted(limit: Int): [Content]!
  stories(limit: Int): [Story]!
  comments(limit: Int): [Comment]!
}

enum ItemType {
  STORY
  COMMENT
  ASK
  JOB
}

interface Content {
  id: ID!
  type: ItemType!
  time: Int!
  title: String
  author: User
}

# {
#   "by" : "dhouston",
#   "descendants" : 71,
#   "id" : 8863,
#   "kids" : [ ... ],
#   "score" : 111,
#   "time" : 1175714200,
#   "title" : "My YC app: Dropbox - Throw away your USB drive",
#   "type" : "story",
#   "url" : "http://www.getdropbox.com/u/2/screencast.html"
# }
type Story implements Content {
  id: ID!
  type: ItemType!
  time: Int!
  title: String!
  author: User

  descendants: Int!
  score: Int!
  url: String!
  comments: [Comment]!
}

# {
#   "by" : "tel",
#   "descendants" : 16,
#   "id" : 121003,
#   "kids" : [ ... ],
#   "score" : 25,
#   "text" : "...",
#   "time" : 1203647620,
#   "title" : "Ask HN: The Arc Effect",
#   "type" : "story"
# }
type Ask implements Content {
  id: ID!
  type: ItemType!
  time: Int!
  title: String!
  author: User

  descendants: Int!
  score: Int!
  url: String!
  text: String

  comments: [Comment]!
}

# {
#   "by" : "justin",
#   "id" : 192327,
#   "score" : 6,
#   "text" : "...",
#   "time" : 1210981217,
#   "title" : "Justin.tv is looking for a Lead Flash Engineer!",
#   "type" : "job",
#   "url" : ""
# }
type Job implements Content {
  id: ID!
  type: ItemType!
  time: Int! #Date!
  title: String!
  author: User

  score: Int!
  url: String!
  text: String
}

# {
#   "by" : "norvig",
#   "id" : 2921983,
#   "kids" : [ ... ],
#   "parent" : 2921506,
#   "text" : "...",
#   "time" : 1314211127,
#   "type" : "comment"
# }
type Comment implements Content {
  id: ID!
  type: ItemType!
  time: Int!
  title: String
  author: User!

  # UNIQUE
  parent: Content!
  text: String
  comments(limit: Int): [Content]!
  hasReplies: Boolean!
}

type Stub {
  id: ID!
  name: String!
}

type Query {
  stub: Stub

  user(id: ID!): User
  item(id: ID!): Content
  top(limit: Int): [Content]!
  new(limit: Int): [Content]!
  best(limit: Int): [Content]!
}
`;

function author({by}, _args, {dataSources: {hackerNewsSource}}, info) {
  const requestedFields = new Set(info.fieldNodes.flatMap(
    (node) => node.selectionSet.selections.map((field) => field.name.value),
  ));
  requestedFields.delete("id");
  requestedFields.delete("username");
  requestedFields.delete("__typename");
  if (requestedFields.size) {
    return hackerNewsSource.getUser(by);
  }

  return {id: by || "", username: by || ""};
}

const resolvers = {
  Query: {
    item(_, {id}, {dataSources: {hackerNewsSource}}) {
      return hackerNewsSource.getItem(id);
    },

    user(_, {id}, {dataSources: {hackerNewsSource}}) {
      return hackerNewsSource.getUser(id);
    },

    async top(_, {limit}, {dataSources: {hackerNewsSource}}) {
      let ids = await hackerNewsSource.getTopStories();
      ids = ids.slice(0, limit);
      let items = await Promise.all(ids.map((id) => hackerNewsSource.getItem(id)));
      items = items.filter((item) => item);
      return items;
    },

    async ["new"](_, {limit}, {dataSources: {hackerNewsSource}}) {
      let ids = await hackerNewsSource.getNewStories();
      ids = ids.slice(0, limit);
      let items = await Promise.all(ids.map((id) => hackerNewsSource.getItem(id)));
      items = items.filter((item) => item);
      return items;
    },

    async best(_, {limit}, {dataSources: {hackerNewsSource}}) {
      let ids = await hackerNewsSource.getBestStories();
      ids = ids.slice(0, limit);
      let items = await Promise.all(ids.map((id) => hackerNewsSource.getItem(id)));
      items = items.filter((item) => item);
      return items;
    },

    stub() {
      return {id: 0};
    },
  },

  Stub: {
    async name() {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return "stubby";
    },
  },

  User: {
    async username(parent) {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 1000));
      return parent.id;
    },

    submitted({submitted = []}, {limit}, {dataSources: {hackerNewsSource}}) {
      const ids = submitted.slice(0, limit);
      return Promise.all(ids.map((id) => hackerNewsSource.getItem(id)));
    },

    async comments({submitted = []}, {limit}, {dataSources: {hackerNewsSource}}) {
      const ids = submitted.slice(0, limit);
      const items = await Promise.all(ids.map((id) =>
        hackerNewsSource.getItem(id)
      ));

      return items.filter((item) => (item.type === "comment" && !item.deleted));
    },

    async stories(parent, {limit}, {dataSources: {hackerNewsSource}}) {
      const ids = parent.submitted.slice(0, limit);
      const items = await Promise.all(ids.map((id) =>
        hackerNewsSource.getItem(id)
      ));

      return items.filter((item) => item.type === "story");
    }
  },

  Content: {
    __resolveType(parent) {
      switch (parent.type) {
        case "comment":
          return "Comment";
        case "job":
          return "Job";
        case "story": {
          if (parent.text) {
            return "Ask";
          } else {
            return "Story";
          }
        }
        default:
          throw new Error(`Unknown type ${parent.type}`);
      }
    },
  },

  Story: {
    type() {
      return "STORY";
    },
    author,
    async comments({kids = []}, {limit}, {dataSources: {hackerNewsSource}}) {
      const ids = kids.slice(0, limit);
      const results = await Promise.all(
        ids.map((id) => hackerNewsSource.getItem(id)),
      );

      return results.filter((item) => (item.type === "comment" && !item.deleted));
    },
  },

  Comment: {
    type() {
      return "COMMENT";
    },
    author,
    parent({parent}, {}, {dataSources: {hackerNewsSource}}) {
      return hackerNewsSource.getItem(parent);
    },
    async comments({kids = []}, {limit}, {dataSources: {hackerNewsSource}}) {
      const ids = kids.slice(0, limit);
      const results = await Promise.all(
        ids.map((id) => hackerNewsSource.getItem(id)),
      );

      return results.filter((item) => (item.type === "comment" && !item.deleted));
    },

    hasReplies({kids = []}) {
      return !!kids.length;
    },
  },

  Ask: {
    type() {
      return "ASK";
    },
    author,
    async comments({kids = []}, {limit}, {dataSources: {hackerNewsSource}}) {
      const ids = kids.slice(0, limit);
      const results = await Promise.all(
        ids.map((id) => hackerNewsSource.getItem(id)),
      );

      return results.filter((item) => (item.type === "comment" && !item.deleted));
    },
  },

  Job: {
    type() {
      return "JOB";
    },
    author,
  },
};

const schema = makeExecutableSchema({typeDefs, resolvers});


import express from "express";
import cors from "cors";
import {
  getGraphQLParameters,
  processRequest,
  renderGraphiQL,
  shouldRenderGraphiQL,
} from "graphql-helix";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/graphql", async (req, res) => {
  // Create a generic Request object that can be consumed by Graphql Helix's API
  const request = {
    body: req.body,
    headers: req.headers,
    method: req.method,
    query: req.query,
  };

  // Determine whether we should render GraphiQL instead of returning an API response
  if (shouldRenderGraphiQL(request)) {
    res.send(renderGraphiQL());
  } else {
    // Extract the GraphQL parameters from the request
    const { operationName, query, variables } = getGraphQLParameters(request);

    // Validate and execute the query
    const result = await processRequest({
      operationName,
      query,
      variables,
      request,
      schema,
      contextFactory() {
        return {
          dataSources: {
            hackerNewsSource: new HackerNewsSource(),
          },
        };
      },
    });

    // processRequest returns one of three types of results depending on how the server should respond
    // 1) RESPONSE: a regular JSON payload
    // 2) MULTIPART RESPONSE: a multipart response (when @stream or @defer directives are used)
    // 3) PUSH: a stream of events to push back down the client for a subscription
    if (result.type === "RESPONSE") {
      // We set the provided status and headers and just the send the payload back to the client
      result.headers.forEach(({ name, value }) => res.setHeader(name, value));
      res.status(result.status);
      res.json(result.payload);
    } else if (result.type === "MULTIPART_RESPONSE") {
      // Indicate we're sending a multipart response
      res.writeHead(200, {
        Connection: "keep-alive",
        "Content-Type": 'multipart/mixed; boundary="-"',
        "Transfer-Encoding": "chunked",
      });

      // If the request is closed by the client, we unsubscribe and stop executing the request
      req.on("close", () => {
        result.unsubscribe();
      });

      res.write("---");

      // Subscribe and send back each result as a separate chunk. We await the subscribe
      // call. Once we're done executing the request and there are no more results to send
      // to the client, the Promise returned by subscribe will resolve and we can end the response.
      await result.subscribe((result) => {
        const chunk = Buffer.from(JSON.stringify(result), "utf8");
        const data = [
          "",
          "Content-Type: application/json; charset=utf-8",
          "Content-Length: " + String(chunk.length),
          "",
          chunk,
        ];

        if (result.hasNext) {
          data.push("---");
        }

        res.write(data.join("\r\n"));
      });

      res.write("\r\n-----\r\n");
      res.end();
    } else {
      // Indicate we're sending an event stream to the client
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
      });

      // If the request is closed by the client, we unsubscribe and stop executing the request
      req.on("close", () => {
        result.unsubscribe();
      });

      // We subscribe to the event stream and push any new events to the client
      await result.subscribe((result) => {
        res.write(`data: ${JSON.stringify(result)}\n\n`);
      });
    }
  }
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`GraphQL server is running on port ${port}.`);
});
