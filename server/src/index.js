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
type Item {
	id: ID!
	time: Int
	score: Int
	type: String
	text: String
	by: String
	title: String
	url: String
}

type User {
	id: ID!
	created: Int
	karma: Int
	about: String
	submitted(limit: Int): [Item]!
}

type Query {
	item(id: ID!): Item
	user(username: ID!): User
}
`;

const server = new ApolloServer({
	typeDefs,
	resolvers: {
		Query: {
			item(_source, {id}, {dataSources: {hackerNewsAPI}}) {
				return hackerNewsAPI.getItem(id);
			},
			async user(_source, {username}, {dataSources: {hackerNewsAPI}}) {
				const user = await hackerNewsAPI.getUser(username);
				return user;
			},
		},
		User: {
			submitted(parent, args, {dataSources: {hackerNewsAPI}}) {
				console.log(args);
				return Promise.all(parent.submitted.map(async (id) => {
					return hackerNewsAPI.getItem(id);
				}));
			},
		},
	},
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
