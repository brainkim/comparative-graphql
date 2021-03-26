import {gql, ApolloServer} from "apollo-server";
import {RESTDataSource} from "apollo-datasource-rest";

class HackerNewsAPI extends RESTDataSource {
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
	created: Int
	karma: Int
	about: String
	submitted(limit: Int): [Item]!
}

# {
#   "by" : "dhouston",
#   "descendants" : 71,
#   "id" : 8863,
#   "kids" : [ 8952, 9224, 8917, 8884, 8887, 8943, 8869, 8958, 9005, 9671, 8940, 9067, 8908, 9055, 8865, 8881, 8872, 8873, 8955, 10403, 8903, 8928, 9125, 8998, 8901, 8902, 8907, 8894, 8878, 8870, 8980, 8934, 8876 ],
#   "score" : 111,
#   "time" : 1175714200,
#   "title" : "My YC app: Dropbox - Throw away your USB drive",
#   "type" : "story",
#   "url" : "http://www.getdropbox.com/u/2/screencast.html"
# }

type Item {
	id: ID!
	time: Int
	# only for stories
	score: Int
	type: String
	text: String
	by: User
	title: String
	url: String
}

# {
#   "by" : "dhouston",
#   "descendants" : 71,
#   "id" : 8863,
#   "kids" : [ 8952, 9224, 8917, 8884, 8887, 8943, 8869, 8958, 9005, 9671, 8940, 9067, 8908, 9055, 8865, 8881, 8872, 8873, 8955, 10403, 8903, 8928, 9125, 8998, 8901, 8902, 8907, 8894, 8878, 8870, 8980, 8934, 8876 ],
#   "score" : 111,
#   "time" : 1175714200,
#   "title" : "My YC app: Dropbox - Throw away your USB drive",
#   "type" : "story",
#   "url" : "http://www.getdropbox.com/u/2/screencast.html"
# }

type Story {
	by: User
	descendants: Int
	id: ID
	score: Int
	time: Int
	title: String
	url: String
	#kids: ??????
}

# {
#   "by" : "norvig",
#   "id" : 2921983,
#   "kids" : [ 2922097, 2922429, 2924562, 2922709, 2922573, 2922140, 2922141 ],
#   "parent" : 2921506,
#   "text" : "Aw shucks, guys ... you make me blush with your compliments.<p>Tell you what, Ill make a deal: I'll keep writing if you keep reading. K?",
#   "time" : 1314211127,
#   "type" : "comment"
# }

type Comment {
	by: User
	id: ID!
	parent: ID
	text: String
	time: Int
}

# {
#   "by" : "tel",
#   "descendants" : 16,
#   "id" : 121003,
#   "kids" : [ 121016, 121109, 121168 ],
#   "score" : 25,
#   "text" : "<i>or</i> HN: the Next Iteration<p>I get the impression that with Arc being released a lot of people who never had time for HN before are suddenly dropping in more often. (PG: what are the numbers on this? I'm envisioning a spike.)<p>Not to say that isn't great, but I'm wary of Diggification. Between links comparing programming to sex and a flurry of gratuitous, ostentatious  adjectives in the headlines it's a bit concerning.<p>80% of the stuff that makes the front page is still pretty awesome, but what's in place to keep the signal/noise ratio high? Does the HN model still work as the community scales? What's in store for (++ HN)?",
#   "time" : 1203647620,
#   "title" : "Ask HN: The Arc Effect",
#   "type" : "story"
# }

type Ask {
	by: User
}

type Query {
	user(id: ID!): User
	item(id: ID!): Item
	story(id: ID!): Story
}
`;

const resolvers = {
	Query: {
		item(_source, {id}, {dataSources: {hackerNewsAPI}}) {
			return hackerNewsAPI.getItem(id);
		},
		async story(_source, {id}, {dataSources: {hackerNewsAPI}}) {
			const item = await hackerNewsAPI.getItem(id);
			if (item && item.type === "story") {
				return item;
			}
		},
		user(_source, {id}, {dataSources: {hackerNewsAPI}}) {
			return hackerNewsAPI.getUser(id);
		},
	},
	Item: {
		by(parent) {
			console.log(parent.by);
			return hackerNewsAPI.getUser(parent.by);
		}
	},
	User: {
		username(parent) {
			return parent.id;
		},
		submitted(parent, {limit}, {dataSources: {hackerNewsAPI}}) {
			return Promise.all(parent.submitted.slice(0, limit).map(async (id) => {
				return hackerNewsAPI.getItem(id);
			}));
		},
	},
};

const server = new ApolloServer({
	typeDefs,
	resolvers,
	dataSources() {
		return {hackerNewsAPI: new HackerNewsAPI()};
	},
});

server.listen().then(() => {
	console.log(`
🚀  Server is running!
🔉  Listening on port 4000
📭  Query at https://studio.apollographql.com/dev`);
});
