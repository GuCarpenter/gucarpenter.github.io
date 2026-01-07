import { getCollection } from 'astro:content';

export async function GET({}) {
	const posts = await getCollection('blog');
	const searchList = posts.map((post) => ({
		title: post.data.title,
		description: post.data.description,
        body: post.body,
		slug: `/blog/${post.id}/`,
		lang: post.data.lang,
        pubDate: post.data.pubDate.valueOf(),
	})).sort((a, b) => b.pubDate - a.pubDate);

	return new Response(JSON.stringify(searchList), {
		headers: {
			'content-type': 'application/json',
		},
	});
}