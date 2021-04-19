import {gql, ApolloServer} from "apollo-server";
import {RESTDataSource} from "apollo-datasource-rest";

class HackerNewsSource extends RESTDataSource {
	constructor() {
		super();
		this.baseURL = "https://hacker-news.firebaseio.com/v0/";
	}

	getItem(id) {
		return this.get(`item/${id.toString()}.json`);
	}

	getUser(username) {
		return this.get(`user/${username}.json`);
	}

	getTopStories() {
		return this.get("topstories.json");
	}

	getNewStories() {
		return this.get("newstories.json");
	}

	getBestStories() {
		return this.get("beststories.json");
	}
}

const typeDefs = gql`
# {
#   "about" : "This is a test",
#   "created" : 1173923446,
#   "delay" : 0,
#   "id" : "jl",
#   "karma" : 2937,
#   "submitted" : [ ... ]
# }
type User {
	id: ID!
	username: ID!
	created: Int!
	karma: Int!
	about: String
	submitted(limit: Int, type: ItemType): [Item]!
	stories(limit: Int): [Story]!
	comments(limit: Int): [Comment]!
}

enum ItemType {
	STORY
	COMMENT
	ASK
	JOB
}

interface Item {
	id: ID!
	type: ItemType!
	by: User
	time: Int!
}

interface FeedItem implements Item {
	id: ID!
	type: ItemType!
	by: User
	time: Int!
	title: String!
}

#{
#  "by" : "dhouston",
#  "descendants" : 71,
#  "id" : 8863,
#  "kids" : [ 8952, 9224, 8917, 8884, 8887, 8943, 8869, 8958, 9005, 9671, 8940, 9067, 8908, 9055, 8865, 8881, 8872, 8873, 8955, 10403, 8903, 8928, 9125, 8998, 8901, 8902, 8907, 8894, 8878, 8870, 8980, 8934, 8876 ],
#  "score" : 111,
#  "time" : 1175714200,
#  "title" : "My YC app: Dropbox - Throw away your USB drive",
#  "type" : "story",
#  "url" : "http://www.getdropbox.com/u/2/screencast.html"
#}
type Story implements Item & FeedItem {
	# ITEM
	id: ID!
	type: ItemType!
	by: User
	time: Int!
	# FEEDITEM
	title: String!
	# UNIQUE
	descendants: Int!
	score: Int!
	url: String!
	kids(limit: Int): [Item]!
}

#{
#  "by" : "tel",
#  "descendants" : 16,
#  "id" : 121003,
#  "kids" : [ 121016, 121109, 121168 ],
#  "score" : 25,
#  "text" : "...",
#  "time" : 1203647620,
#  "title" : "Ask HN: The Arc Effect",
#  "type" : "story"
#}
type Ask implements Item & FeedItem {
	# SHARED
	id: ID!
	type: ItemType!
	by: User
	time: Int!
	title: String!
	# UNIQUE
	descendants: Int!
	score: Int!
	url: String!
	text: String
	kids(limit: Int): [Item]!
}

#{
#  "by" : "justin",
#  "id" : 192327,
#  "score" : 6,
#  "text" : "...",
#  "time" : 1210981217,
#  "title" : "Justin.tv is looking for a Lead Flash Engineer!",
#  "type" : "job",
#  "url" : ""
#}
type Job implements Item & FeedItem {
	# SHARED
	id: ID!
	type: ItemType!
	by: User
	time: Int!
	title: String!

	# UNIQUE
	score: Int!
	text: String
	url: String!
}

#{
#  "by" : "norvig",
#  "id" : 2921983,
#  "kids" : [ 2922097, 2922429, 2924562, 2922709, 2922573, 2922140, 2922141 ],
#  "parent" : 2921506,
#  "text" : "Aw shucks, guys ... you make me blush with your compliments.<p>Tell you what, Ill make a deal: I'll keep writing if you keep reading. K?",
#  "time" : 1314211127,
#  "type" : "comment"
#}
type Comment implements Item {
	# SHARED
	id: ID!
	type: ItemType!
	by: User!
	time: Int!

	# UNIQUE
	parent: Item!
	text: String
	kids(limit: Int): [Item]!
}

type Query {
	user(id: ID!): User
	item(id: ID!): Item
	story(id: ID!): Story

	topStories(limit: Int): [FeedItem]!
	newStories(limit: Int): [FeedItem]!
	bestStories(limit: Int): [FeedItem]!
}
`;

function by(parent, _args, {dataSources: {hackerNewsSource}}, info) {
	const requestedFields = new Set(info.fieldNodes.flatMap(
		(node) => node.selectionSet.selections.map((field) => field.name.value),
	));
	requestedFields.delete("id");
	requestedFields.delete("username");
	requestedFields.delete("__typename");
	if (requestedFields.size) {
		return hackerNewsSource.getUser(parent.by);
	}
	return {id: parent.by || "", username: parent.by || ""};
}

const resolvers = {
	Query: {
		item(_parent, {id}, {dataSources: {hackerNewsSource}}) {
			return hackerNewsSource.getItem(id);
		},

		async story(_parent, {id}, {dataSources: {hackerNewsSource}}) {
			const item = await hackerNewsSource.getItem(id);
			if (item && item.type === "story") {
				return item;
			}
		},

		user(_parent, {id}, {dataSources: {hackerNewsSource}}) {
			return hackerNewsSource.getUser(id);
		},

		async topStories(_source, {limit}, {dataSources: {hackerNewsSource}}) {
			let ids = await hackerNewsSource.getTopStories();
			ids = ids.slice(0, limit);
			let items = await Promise.all(ids.map((id) => hackerNewsSource.getItem(id)));
			items = items.filter((item) => item);
			return items;
		},

		async newStories(_source, {limit}, {dataSources: {hackerNewsSource}}) {
			let ids = await hackerNewsSource.getNewStories();
			ids = ids.slice(0, limit);
			const items = await Promise.all(ids.map((id) => hackerNewsSource.getItem(id)));
			return items;
		},

		async bestStories(_source, {limit}, {dataSources: {hackerNewsSource}}) {
			let ids = await hackerNewsSource.getBestStories();
			ids = ids.slice(0, limit);
			const items = await Promise.all(ids.map((id) => hackerNewsSource.getItem(id)));
			return items;
		},
	},

	User: {
		username(parent) {
			return parent.id;
		},

		async submitted(parent, {limit, type}, {dataSources: {hackerNewsSource}}) {
			const ids = parent.submitted.slice(0, limit);
			let items = await Promise.all(ids.map((id) =>
				hackerNewsSource.getItem(id)
			));

			if (type) {
				items = items.filter((item) => item.type === type.toLowerCase());
			}

			return items;
		},

		async comments(parent, {limit}, {dataSources: {hackerNewsSource}}) {
			const ids = parent.submitted.slice(0, limit);
			const items = await Promise.all(ids.map((id) =>
				hackerNewsSource.getItem(id)
			));

			return items.filter((item) => item.type === "comment");
		},

		async stories(parent, {limit}, {dataSources: {hackerNewsSource}}) {
			const ids = parent.submitted.slice(0, limit);
			const items = await Promise.all(ids.map((id) =>
				hackerNewsSource.getItem(id)
			));

			return items.filter((item) => item.type === "story");
		}
	},

	Item: {
		__resolveType(parent) {
			switch (parent.type) {
				case "comment":
					return "Comment";
				case "story": {
					if (parent.text) {
						return "Ask";
					} else {
						return "Story";
					}
				}
				case "job":
					return "Job";
				default:
					throw new Error(`Unknown type ${parent.type}`);
			}
		},
	},

	FeedItem: {
		__resolveType(parent) {
			switch (parent.type) {
				case "comment":
					return "Comment";
				case "story": {
					if (parent.text) {
						return "Ask";
					} else {
						return "Story";
					}
				}
				case "job":
					return "Job";
				default:
					throw new Error(`Unknown type ${parent.type}`);
			}
		},
	},

	Story: {
		type() {
			return "STORY";
		},
		by,
		async kids(parent, {limit}, {dataSources: {hackerNewsSource}}) {
			const kids = parent.kids || [];
			let results = await Promise.all(kids.slice(0, limit).map((id) => hackerNewsSource.getItem(id)));
			results = results.filter((result) => !result.deleted);
			return results;
		},
	},

	Comment: {
		type() {
			return "COMMENT";
		},
		by,
		parent(parent, {}, {dataSources: {hackerNewsSource}}) {
			return hackerNewsSource.getItem(parent.parent);
		},
		kids(parent, {limit}, {dataSources: {hackerNewsSource}}) {
			const kids = parent.kids || [];
			return Promise.all(kids.slice(0, limit).map((id) => hackerNewsSource.getItem(id)));
		},
	},

	Ask: {
		type() {
			return "ASK";
		},
		by,
		kids(parent, {limit}, {dataSources: {hackerNewsSource}}) {
			const kids = parent.kids || [];
			return Promise.all(kids.slice(0, limit).map((id) => hackerNewsSource.getItem(id)));
		},
	},

	Job: {
		type() {
			return "JOB";
		},
		by,
	},
};

const server = new ApolloServer({
	typeDefs,
	resolvers,
	dataSources() {
		return {hackerNewsSource: new HackerNewsSource()};
	},
});

server.listen().then(() => {
	console.log("Listening on port 4000");
});
