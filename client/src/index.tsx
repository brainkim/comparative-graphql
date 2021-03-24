import type { Context } from '@bikeshaving/crank/crank.js';
import { createElement } from '@bikeshaving/crank/crank.js';
import { renderer } from '@bikeshaving/crank/dom.js';

function* App(this: Context) {
  for ({} of this) {
    yield (
      <div class="app">
        <div>This is not the happy path</div>
      </div>
    );
  }
}

renderer.render(<App />, document.getElementById('root')!);
