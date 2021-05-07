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

const HOMEPAGE = gql`
query HomePage {
  topStories(limit: 20) {
    id
    by {
      username
    }
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
