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
  top(limit: 20) {
    id
    title
    ... on Story @defer {
      author {
        id
        username
        karma
      }
    }
  }
}
`;

function App() {
  const {data, loading, error} = useQuery(HOMEPAGE, {fetchPolicy: 'no-cache'});
  console.log({data, loading, error});
  if (loading) {
    return <div>Loading...</div>;
  } else if (error) {
    return <div>Error: {error.toString()}</div>;
  }

  const {top: items} = data;
  return (
    <ol>
      {items.map((story, i) => (
        <li key={i}>
          {story.id} {story.title} {story.author ? `${story.author.username} (${story.author.karma})` : null}
        </li>
      ))}
    </ol>
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
