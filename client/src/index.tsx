import type {Context} from '@bikeshaving/crank/crank.js';
import {createElement} from '@bikeshaving/crank/crank.js';
import {renderer} from '@bikeshaving/crank/dom.js';
import {ApolloClient, InMemoryCache, gql} from '@apollo/client/core';

const HOMEPAGE = gql`
query HomePage {
  topStories(limit: 20) {
    id
    by {
      id
    }
    title
    type
    ... on Story {
      url
      descendants
    }
  }
}
`;

const client = new ApolloClient({
  uri: "http://localhost:4000/graphql",
  cache: new InMemoryCache(),
});

(async () => {
  console.log(await client.query({query: HOMEPAGE}));
})();

async function Home() {
  const {data} = await client.query({query: HOMEPAGE});
  return data.topStories.map((story: any) => {
    console.log(story);
    return (
      <div crank-key={story.id}>
        <a href={story.url} target="_blank">{story.title}</a>
        {" "}
        <span>({story.descendants} comments)</span>
      </div>
    );
  });
}

function *App(this: Context) {
  for ({} of this) {
    yield (
      <div class="app">
        <Home />
      </div>
    );
  }
}

renderer.render(<App />, document.getElementById('root')!);
