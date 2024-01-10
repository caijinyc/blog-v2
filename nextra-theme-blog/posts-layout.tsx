import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useRef, type ReactElement, type ReactNode } from 'react'
import { BasicLayout } from './basic-layout'
import { useBlogContext } from './blog-context'
import { HeadingContext, MDXTheme } from './mdx-theme'
import Nav from './nav'
import { collectPostsAndNavs } from './utils/collect'
import getTags from './utils/get-tags'

export function PostsLayout({
  children
}: {
  children: ReactNode
}): ReactElement {
  const { config, opts } = useBlogContext()
  const { posts } = collectPostsAndNavs({ config, opts })
  const router = useRouter()
  const { type } = opts.frontMatter
  const tagName = type === 'tag' ? router.query.tag : null

  const title = `${opts.title}${config.titleSuffix || ''}`
  const ref = useRef<HTMLHeadingElement>(null)
  const yearMap = useRef<Record<string, string>>({})

  const postList = posts.map(post => {
    if (tagName) {
      const tags = getTags(post)
      if (!Array.isArray(tagName) && !tags.includes(tagName)) {
        return null
      }
    } else if (type === 'tag') {
      return null
    }

    const postTitle = post.frontMatter?.title || post.name
    const date: Date | null = post.frontMatter?.date
      ? new Date(post.frontMatter.date)
      : null
    const description = post.frontMatter?.description

    let yearDom = null
    if (
      date &&
      (!yearMap.current[date.getFullYear()] ||
        yearMap.current[date.getFullYear()] === post.route)
    ) {
      yearDom = (
        <div className="font-normal font-sans text-4xl mt-6 sm:mt-14 p1 mb-6 text-[#D0D1D4] dark:text-[#5d5d5d]">
          {date.getFullYear()}
        </div>
      )
      yearMap.current[date.getFullYear()] = post.route
    }

    return (
      <React.Fragment key={post.route}>
        {yearDom}
        <Link href={post.route} passHref legacyBehavior>
          <div
            key={post.route}
            className="post-item cursor-pointer md:hover:bg-neutral-100 dark:md:hover:bg-neutral-800 hover:rounded"
          >
            <div className={'sm:flex justify-between mb-8 items-center'}>
              <div
                className={
                  'mt-0 mb-0 font-bold text-base md:text-xl flex flex-1'
                }
              >
                <a className="!nx-no-underline font-normal">{postTitle}</a>
              </div>

              {/*{description && (*/}
              {/*  <p className="nx-mb-2 dark:nx-text-gray-400 nx-text-gray-600">*/}
              {/*    {description}*/}
              {/*    {config.readMore && (*/}
              {/*      <Link href={post.route} passHref legacyBehavior>*/}
              {/*        <a className="post-item-more nx-ml-2">{config.readMore}</a>*/}
              {/*      </Link>*/}
              {/*    )}*/}
              {/*  </p>*/}
              {/*)}*/}

              {date && (
                <time
                  className="nx-text-sm dark:nx-text-gray-400 nx-text-gray-600"
                  dateTime={date.toISOString()}
                >
                  {date.toDateString()}
                </time>
              )}
            </div>
          </div>
        </Link>
      </React.Fragment>
    )
  })

  return (
    <article
      className="nx-container nx-prose max-md:nx-prose-sm dark:nx-prose-dark pt-10"
      dir="ltr"
    >
      <HeadingContext.Provider value={ref}>
        <MDXTheme>{children}</MDXTheme>
        {postList}
      </HeadingContext.Provider>
    </article>
  )
}
