/** @jsx createElement */
import {createElement, Fragment, Raw} from "@bikeshaving/crank";
import type {Context} from "@bikeshaving/crank";
import {renderer} from "@bikeshaving/crank/dom";
import {ApolloClient, InMemoryCache, gql, makeVar} from '@apollo/client/core';
import "./index.css";

/*** QUERIES ***/
const ITEM = gql`
query Item($id: ID!) {
  item(id: $id) {
    ... on Ask {
      title
      time
      by {
        username
      }
      kids {
        ... CommentFields
        ... on Comment {
          kids {
            ... CommentFields
            ... on Comment {
              kids {
                ... CommentFields
              }
            }
          }
        }
      }
    }
    ... on Story {
      title
      url
      time
      by {
        username
      }
      kids {
        ... CommentFields
        ... on Comment {
          kids {
            ... CommentFields
            ... on Comment {
              kids {
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
  by {
    username
  }
  expanded @client
}
`;

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

const collapsedCommentsVar = makeVar(new Set());

const cache = new InMemoryCache({
  typePolicies: {
    Comment: {
      fields: {
        expanded: {
          read(_, {variables}) {
            console.log(Date.now(), arguments[0], arguments[1]);
            return true;
          },
        },
      },
    },
  },
});

const client = new ApolloClient({
  uri: "http://localhost:4000/graphql",
  cache,
});

const IS_EXPANDED = gql`
fragment IsExpanded on Comment {
  id
  expanded @client
}
`;

function* Comment(this: Context, {comment}: any) {
  // TODO: Move this logic to apollo local state?
  this.addEventListener("click", (ev) => {
    if ((ev.target as Element).className === "expand") {
      ev.stopPropagation();
      // const collapsedComments = collapsedCommentsVar();
      // collapsedComments.add(comment.id);
      // collapsedCommentsVar(collapsedComments);
      console.log("HELLO?");
      client.writeFragment({
        fragment: IS_EXPANDED,
        data: {
          id: comment.id,
          expanded: false,
        },
      });

      this.refresh();
    }
  });

  for ({comment} of this) {
    yield (
      <div class="comment">
        <p>
          <button class="expand">{comment.expanded ? "[-]" : "[+]"}</button>{" "}
          <a href="">{comment.by.username}</a> {comment.time}{" "}
        </p>
        <div style={{display: comment.expanded ? null : "none"}}>
          <p>
            <Raw value={comment.text} />
          </p>
          <div class="replies">
            {comment.kids && comment.kids.map((reply: any) => (
              <Comment crank-key={reply.id} comment={reply} />
            ))}
          </div>
        </div>
      </div>
    );
  }
}

async function Item({id}: any) {
  const {data: {item}} = await client.query({query: ITEM, variables: {id}});
  const domain = item.url;
  //const domain = new URL(item.url || "").origin;
  return (
    <div class="item">
      <a href={item.url}>
        <h1>{item.title}</h1>
      </a>
      <p class="domain">{domain}</p>
      <p class="meta">
        submitted by <a>{item.by && item.by.username}</a> {item.time}
      </p>
      {item.kids && item.kids.map((comment: any) => (
        <Comment comment={comment} crank-key={comment.id} />
      ))}
    </div>
  );
}

function Story({story}: any) {
  const domain = story.url;
  return (
    <li class="story">
      <a href={story.url}>{story.title}</a> <span>({domain})</span>
      <p class="meta">
        {story.score} points by <a href="">{story.by && story.by.username}</a> | {story.time}{" "}
        | <a href={`#/item/${story.id}`}>{story.descendants} comments</a>
      </p>
    </li>
  );
}

function Pager({page}: any) {
  return (
    <div class="pager">
      <div>
        <a>Previous </a> {page}/25 <a>Next</a>
      </div>
    </div>
  );
}

async function List({page, start = 1}: any) {
  const {data: {topStories: items}} = await client.query({query: HOMEPAGE});
  return (
    <Fragment>
      <Pager page={page} />
      <ol start={start}>
        {items.map((story: any) =>
          <Story story={story} crank-key={story.id} />
        )}
      </ol>
      <Pager page={page} />
    </Fragment>
  );
}

function parseHash(hash: any) {
  if (hash.startsWith("#/item/")) {
    const id = hash.slice(7);
    if (id) {
      return {route: "item", id};
    }
  } else if (hash.startsWith("#/top/")) {
    const page = parseInt(hash.slice(6)) || 1;
    if (!Number.isNaN(page)) {
      return {route: "top", page};
    }
  }
}

async function Loading({wait = 2000}) {
  await new Promise((resolve) => setTimeout(resolve, wait));
  return <span>Loading...</span>;
}

async function* App(this: Context) {
  let data: any;
  const onhashchange = (ev?: Event) => {
    const hash = window.location.hash;
    data = parseHash(hash);
    if (data == null) {
      data = {route: "top", page: 1};
      window.location.hash = "#/";
    }

    if (ev) {
      this.refresh();
    }
  };

  window.addEventListener("hashchange", onhashchange);
  try {
    onhashchange();
    for await (const _ of this) {
      yield <Loading />;
      switch (data.route) {
        case "item": {
          await (yield <Item {...data} />);
          break;
        }
        case "top": {
          await (yield <List {...data} />);
          break;
        }
      }

      window.scrollTo(0, 0);
    }
  } finally {
    window.removeEventListener("hashchange", onhashchange);
  }
}

function Navbar() {
  return <div class="navbar">Top New Show Ask Jobs</div>;
}

function Root() {
  return (
    <div class="root">
      <Navbar />
      <App />
    </div>
  );
}

renderer.render(<Root />, document.body.firstElementChild!);
