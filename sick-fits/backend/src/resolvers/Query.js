const { forwardTo } = require('prisma-binding');

const Query = {
    // signature(parents, args, ctx, info) {
    //     return 
    // }

    // async items(parents, args, ctx, info) {
    //     const items = await ctx.db.query.items();
    //     return items;
    // }

    items: forwardTo('db')
};

module.exports = Query;
