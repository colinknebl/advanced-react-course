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
	},

	async order(parent, args, ctx, info) {
		// 1. make sure the user is logged in
		if (!ctx.request.userId)
			throw new Error('Must be logged in to view order');
		// 2. query the current order
		const order = await ctx.db.query.order(
			{
				where: { id: args.id }
			},
			info
		);
		// 3. check if they have permission to view the order
		const ownsOrder = order.user.id === ctx.request.userId;
		const hasPermissionToViewOrder = ctx.request.user.permissions.includes(
			'ADMIN'
		);
		if (!ownsOrder && !hasPermissionToViewOrder)
			throw new Error(
				'You do not have permissions required to view this order.'
			);
		// 4. return the order
		return order;
	},

	async orders(parent, args, ctx, info) {
		// 1. make sure the user is logged in
		if (!ctx.request.userId)
			throw new Error('Must be logged in to view orders');
		// 2. make sure the user has permissions to view the orders
		const hasPermissionToViewOrder = ctx.request.user.permissions.includes(
			'ADMIN'
		);
		if (!hasPermissionToViewOrder)
			throw new Error(
				'You do not have permissiosn required to view orders.'
			);
		// 3. get the user's orders from the db
		return ctx.db.query.orders(
			{
				where: {
					user: {
						id: ctx.request.userId
					}
				}
			},
			info
		);
		// 4. return the orders
	}
};

module.exports = Query;
