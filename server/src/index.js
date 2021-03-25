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

const resolvers = {
	Query: {
		item(_source, {id}, {dataSources: {hackerNewsAPI}}) {
			return hackerNewsAPI.getItem(id);
		},
		user(_source, {username}, {dataSources: {hackerNewsAPI}}) {
			return hackerNewsAPI.getUser(username);
		},
	},
	User: {
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
