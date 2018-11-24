const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer'),
	db = require('./db');

const server = createServer();

// TODO: use express middleware to handle cookies (JWT)
server.express.use(cookieParser());

// TODO: use express middleware to populate current user
// decode the JWT so we can get the user ID on each request
server.express.use((req, res, next) => {
	const { token } = req.cookies;
	if (token) {
		const { userId } = jwt.verify(token, process.env.APP_SECRET);
		// put the userId on the request for futreu requests to access
		req.userId = userId;
	}
	next();
});

// 2. create a middleware that populates the user on each request
server.express.use(async (req, res, next) => {
	// if there is no logged in user, skip this
	if (!req.userId) return next();

	// if there is a user ID, query the user
	const user = await db.query.user(
		{ where: { id: req.userId } },
		`{
			id
			name
			email
			permissions
		}`
	);
	req.user = user;
	next();
});

server.start(
	{
		cors: {
			credentials: true,
			origin: process.env.FRONTEND_URL
		}
	},
	details => {
		console.log(
			`Server is now running on port http://localhost:${details.port}`
		);
	}
);
