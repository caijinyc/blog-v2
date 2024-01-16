/* eslint sort-keys: error */
import type { NextraBlogTheme } from './types'

const YEAR = new Date().getFullYear()
export const DEFAULT_THEME: NextraBlogTheme = {
    footer: (
        <footer>
            <small>
                <time>{YEAR}</time> © Jin
                <a href="/feed.xml">RSS</a>
            </small>
            <style jsx>{`
        footer {
          margin-top: 8rem;
        }
        a {
          float: right;
        }
      `}</style>
        </footer>
    ),

  // readMore: 'Read More →'
}
