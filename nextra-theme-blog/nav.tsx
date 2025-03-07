import Link from 'next/link'
import type { ReactElement } from 'react'
import { useBlogContext } from './blog-context'
import ThemeSwitch from './theme-switch'
import { collectPostsAndNavs } from './utils/collect'

export default function Nav(): ReactElement {
  const { opts, config } = useBlogContext()
  const { navPages } = collectPostsAndNavs({ opts, config })

  return (
    <div className="nx-mb-8 nx-flex nx-items-center nx-gap-3 m-0 mt-4">
      <Link href={'/'} legacyBehavior>
        <a
          aria-label="Jin's blog"
          className="mr-2 text-xl font-black md:text-2xl italic text-black dark:text-gray-100 font-['IBM Plex Sans']"
          href="/"
          style={{
            fontFamily: 'IBM Plex Sans',
            fontVariationSettings: 'normal'
          }}
        >
          Jin's blog
        </a>
      </Link>

      <div className="nx-flex nx-grow nx-flex-wrap nx-items-center nx-justify-end nx-gap-3">
        {navPages.map(page => {
          const name = page.frontMatter?.title || page.name
          if (page.active) {
            return (
              <span
                key={page.route}
                className="nx-cursor-default dark:nx-text-gray-400 nx-text-gray-400"
              >
                {name}
              </span>
            )
          }
          return (
            <Link key={page.route} href={page.route} passHref legacyBehavior>
              <a>{name}</a>
            </Link>
          )
        })}
        {config.navs?.map(nav => (
          <Link key={nav.url} href={nav.url} passHref legacyBehavior>
            <a>{nav.name}</a>
          </Link>
        ))}
      </div>
      {/*{config.darkMode && }*/}

      <ThemeSwitch />
    </div>
  )
}
