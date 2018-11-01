const Query = {
    dogs(parents, args, ctx, info) {
        global.dogs = global.dogs || [];
        return global.dogs;
    }
};

module.exports = Query;
