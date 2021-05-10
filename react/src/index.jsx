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
      id
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
    author {
      id
      username
    }
    ... on Story {
      score
      url
      descendants
    }
  }
}
`;

function Story({story}) {
  const domain = story.url;
  return (
    <li className="story">
      <a href={story.url}>{story.title}</a> <span>({domain})</span>
      <p className="meta">
        {story.score} points by <a href="">{story.author && story.author.username}</a> | {story.time}{" "}
        | <a href={`#/item/${story.id}`}>{story.descendants} comments</a>
      </p>
    </li>
  );
}


function App() {
  const {data, loading, error} = useQuery(HOMEPAGE);
  if (loading) {
    return <div>Loading...</div>;
  } else if (error) {
    return <div>Error {error}</div>;
  }

  console.log(data);
  const {top: items} = data;
  return (
    <ol>
      {items.map((story) =>
        <Story story={story} key={story.id} />
      )}
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
