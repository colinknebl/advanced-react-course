const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');

const Query = {
	// signature(parents, args, ctx, info) {
	//     return
	// }

	// async items(parents, args, ctx, info) {
	//     const items = await ctx.db.query.items();
	//     return items;
	// }

	items: forwardTo('db'),
	item: forwardTo('db'),
	itemsConnection: forwardTo('db'),
	user: forwardTo('db'),
	me(parent, args, ctx, info) {
		// check if there is a current user
		if (!ctx.request.userId) {
			return null;
		}
		return ctx.db.query.user(
			{
				where: {
					id: ctx.request.userId
				}
			},
			info
		);
	},
	async users(parent, args, ctx, info) {
		// 1. check if user is logged in
		if (!ctx.request.userId) {
			throw new Error('You must be logged in.');
		}

		// 2. check if user has permissions to query all users
		hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE']);

		// 3. if they do, query all the users
		return ctx.db.query.users({}, info);
	}
};

module.exports = Query;
