const {promises: fs} = require('fs')
const path = require('path')
const RSS = require('rss')
const matter = require('gray-matter')

async function generate() {
    const feed = new RSS({
        title: "Jin's Blog",
        site_url: 'https://yoursite.com',
        feed_url: 'https://yoursite.com/feed.xml',
    })

    const posts = await fs.readdir(path.join(__dirname, '..', 'pages', 'posts'))

    const flattenPost = async (nameList, dirPath) => {
        const result = [];
        for (let i = 0; i < nameList.length; i++) {
            const isDir = nameList[i].indexOf('.') === -1
            if (isDir) {
                const dirName = nameList[i]
                const currentDirPath = path.join(dirPath, dirName)
                const dirNameList = await fs.readdir(currentDirPath)
                const dirResult = await flattenPost(dirNameList, currentDirPath)
                result.push(...dirResult)
            } else {
                result.push(path.join(dirPath, nameList[i]))
            }
        }

        return result.filter(v => {
            return (v.indexOf('.mdx') !== -1 || v.indexOf('.md') !== -1) && v.indexOf('index.') === -1
        });
    }

    const allPosts = await flattenPost(posts, path.join(__dirname, '..', 'pages', 'posts'));

    await Promise.all(
        allPosts.map(async (filePath) => {

            const content = await fs.readFile(filePath)

            const frontmatter = matter(content)

            feed.item({
                title: frontmatter.data.title,
                url: '/posts/' + filePath.replace(/\.mdx?/, ''),
                date: frontmatter.data.date,
                description: frontmatter.data.description,
                categories: frontmatter.data.tag.split(', '),
                author: frontmatter.data.author,
            })
        })
    )

    await fs.writeFile('./public/feed.xml', feed.xml({indent: true}))
}

generate()
