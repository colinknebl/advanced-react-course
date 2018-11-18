const Mutations = {
	/**
        signature(parent, args, ctx, info) {
            ctx = the context in the request
            return
        } 
     */
	async createItem(parent, args, ctx, info) {
		const item = await ctx.db.mutation.createItem(
			{
				data: { ...args }
			},
			info // passing in the info is how it knows what to return in the query
		);
		return item;
	},

	async updateItem(parent, args, ctx, info) {
		// take a copy of the updates
		const updates = { ...args };
		// remove the ID from the udpates
		delete updates.id;
		// run the update method
		return ctx.db.mutation.updateItem(
			{
				data: updates,
				where: {
					id: args.id
				}
			},
			info
		);
	},

	async deleteItem(parent, args, ctx, info) {
		const where = { id: args.id };
		// 1. find the item
		const item = await ctx.db.query.item(
			{ where },
			`{
            id
            title
        }`
		);
		console.log('item :', item);
		// 2. check if the logged in user owns the item, or has permissions to delete the item
		// TODO:
		// 3. delete the item
		return ctx.db.mutation.deleteItem({ where }, info);
	}
};

module.exports = Mutations;
