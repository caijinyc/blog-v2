const {promises: fs} = require('fs')
const path = require('path')
// https://github.com/jpmonette/feed
const Feed = require('feed').Feed
const matter = require('gray-matter')

async function generate() {
    const feed = new Feed({
        title: "Jin's Blog",
        description: "This is my personal feed!",
        id: "http://example.com/",
        link: "http://example.com/",
        language: "en", // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
        image: "http://example.com/image.png",
        favicon: "http://example.com/favicon.ico",
        copyright: "All rights reserved 2024, Jin",
        // updated: new Date(2013, 6, 14), // optional, default = today
        // generator: "awesome", // optional, default = 'Feed for Node.js'
        // feedLinks: {
        //     json: "https://example.com/json",
        //     atom: "https://example.com/atom"
        // },
        // author: {
        //     name: "John Doe",
        //     email: "johndoe@example.com",
        //     link: "https://example.com/johndoe"
        // }
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
                result.push({
                    absolutePath: path.join(dirPath, nameList[i]),
                    relativePath: path.join(dirPath, nameList[i]).replace(path.join(__dirname, '../pages/posts'), ''),
                    name: nameList[i]
                })
            }
        }

        return result.filter(item => {
            const v = item.absolutePath;
            return (v.indexOf('.mdx') !== -1 || v.indexOf('.md') !== -1) && v.indexOf('index.') === -1
        });
    }

    const allPosts = await flattenPost(posts, path.join(__dirname, '..', 'pages', 'posts'));
    console.log('allPosts', allPosts)

    await Promise.all(
        allPosts.map(async (item) => {
            const filePath = item.absolutePath;

            const content = await fs.readFile(filePath)

            const frontmatter = matter(content)

            console.log('frontmatter.data.date', frontmatter.data.date)
            const url = '/post' + item.relativePath
            feed.addItem({
                title: frontmatter.data.title,
                id: url,
                link: url,
                date: new Date(frontmatter.data.date),
                description: frontmatter.data.description || '',
                content: frontmatter.content,
                categories: frontmatter.data.tag.split(', '),
                author: frontmatter.data.author,
            })
        })
    )

    await fs.writeFile('./public/feed.xml', feed.rss2())
}

generate()
