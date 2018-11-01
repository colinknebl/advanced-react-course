from terminal:

$ prisma login
$ primsa init

update prisma.yml
update variables.env

# deploy
### when a data model is updated, run the deploy script again
$ prisma deploy --env-file variables.env

# connect the node server with the prisma db
1. see src/db.js for how to

# create the GraphQL server
1. see src/createServer.js for how to

# start GraphQL server 
1. see index.js for how to
