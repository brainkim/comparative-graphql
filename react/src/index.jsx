import React from "react";
import {render} from "react-dom";
import {
  ApolloClient,
  gql,
  HttpLink,
  InMemoryCache,
} from "@apollo/client/core";

import {ApolloProvider, useQuery} from "@apollo/client/react";
import "./index.css";

/*** QUERIES ***/
const _ITEM = gql`
query Item($id: ID!) {
  item(id: $id) {
    title
    author {
      username
    }
    time
    ... on Ask {
      comments {
        ... CommentFields
        ... on Comment {
          comments {
            ... CommentFields
            ... on Comment {
              comments {
                ... CommentFields
              }
            }
          }
        }
      }
    }
    ... on Story {
      url
      comments {
        ... CommentFields
        ... on Comment {
          comments {
            ... CommentFields
            ... on Comment {
              comments {
                ... CommentFields
              }
            }
          }
        }
      }
    }
  }
}

fragment CommentFields on Comment {
  id
  text
  time
  author {
    username
  }
}
`;

const HOMEPAGE = gql`
query HomePage {
  top(limit: 20) {
    id
    time
    title
    type
    ... on Story {
      score
      url
      descendants
    }
  }
}
`;



function App() {
  const {loading, data, errors} = useQuery(HOMEPAGE);
  console.log({loading, data, errors});
  return (
    <main>Blegh React huh</main>
  );
}

const link = new HttpLink({uri: "http://localhost:4000/graphql"});
const cache = new InMemoryCache();
const client = new ApolloClient({link, cache});

render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById("root"),
);
