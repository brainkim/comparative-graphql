import type { Context } from '@bikeshaving/crank/crank.js';
import { createElement } from '@bikeshaving/crank/crank.js';
import { renderer } from '@bikeshaving/crank/dom.js';

import './index.css';
import logo from './logo.svg';

function* App(this: Context) {
  let count = 0;
  const interval = setInterval(() => {
    count++;
    this.refresh();
  }, 1000);

  try {
    for ({} of this) {
      yield (
        <div class="app">
          <header class="app-header">
            <img src={logo} class="crank-logo" />
            <h1>Crank.js</h1>
            <p>
              Page has been open for <code>{count}</code> seconds.
            </p>
            <p>
              <a class="app-link" href="https://crank.js.org/">
                Learn about Crank
              </a>
            </p>
          </header>
        </div>
      );
    }
  } finally {
    clearInterval(interval);
  }
}

renderer.render(<App />, document.getElementById('root')!);
