const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, emailTemplate } = require('../mail');
const { hasPermission } = require('../utils');
const stripe = require('../stripe');

const Mutations = {
	/**
        signature(parent, args, ctx, info) {
            ctx = the context in the request
            return
        } 
     */
	async createItem(parent, args, ctx, info) {
		if (!ctx.request.userId) {
			throw new Error('You must be logged in to create an item.');
		}
		const item = await ctx.db.mutation.createItem(
			{
				data: {
					...args,
					// create a relationshipt between the item and the user
					user: {
						connect: {
							id: ctx.request.userId
						}
					}
				}
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
				user {
					id
					name
					permissions
				}
			}`
		);
		// 2. check if the logged in user owns the item, or has permissions to delete the item
		const ownsItem = ctx.request.userId === item.user.id;
		const hasPermissions = item.user.permissions.some(permission =>
			['ADMIN', 'ITEMDELETE'].includes(permission)
		);

		if (!ownsItem && !hasPermissions) {
			throw new Error(
				'You do not have the required permissions to delete this item.'
			);
		}
		// 3. delete the item
		return ctx.db.mutation.deleteItem({ where }, info);
	},

	async signup(parent, args, ctx, info) {
		// 1. lowercase the email
		args.email = args.email.toLowerCase();
		// 2. hash the password
		const password = await bcrypt.hash(args.password, 10);
		// 3. create the user in the database
		const user = await ctx.db.mutation.createUser(
			{
				data: {
					...args,
					password,
					permissions: { set: ['USER'] }
				}
			},
			info
		);
		// 4. create the JWT token for the new user
		const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
		// 5. set the JWT as a cookie on the response
		ctx.response.cookie('token', token, {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
		});
		// 6 return the user to the browser
		return user;
	},

	async signin(parent, { email, password }, ctx, info) {
		// 1. check if there is a user with that email
		const user = await ctx.db.query.user({ where: { email } });
		if (!user) {
			throw new Error(`No user found for email ${email}`);
		}
		// 2. check if their password is correct
		const valid = await bcrypt.compare(password, user.password);
		if (!valid) {
			throw new Error(`Invalid password`);
		}
		// 3. generate the JWT token
		const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
		// 4. set the cookie with the token
		ctx.response.cookie('token', token, {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
		});
		// 5. return the user
		return user;
	},

	async signout(parent, args, ctx, info) {
		ctx.response.clearCookie('token');
		return {
			message: 'Goodbye'
		};
	},

	async requestReset(parent, args, ctx, info) {
		// 1. check if this is a real user
		const user = await ctx.db.query.user({
			where: {
				email: args.email
			}
		});
		if (!user) {
			throw new Error(`No user found for email ${args.email}`);
		}
		// 2. set a reset token and expiry on that user
		// 2a. create reset token and expirary
		const randomBytesPromisified = promisify(randomBytes);
		const resetToken = (await randomBytesPromisified(20)).toString('hex');
		const resetTokenExpirary = Date.now() + 3600000; // 1 hour from now
		// 2b. add reset token and expirary to user in db
		const res = await ctx.db.mutation.updateUser({
			where: { email: args.email },
			data: { resetToken, resetTokenExpirary }
		});
		// 3. email the user the reset token
		const mailRes = await transport.sendMail({
			from: 'colin.knebl@outlook.com',
			to: user.email,
			subject: 'Password reset token',
			html: emailTemplate(`Your password reset token is here! 
				\n\n 
				<a href="${
					process.env.FRONTEND_URL
				}/reset?resetToken=${resetToken}">Click here to reset!</a>
			`)
		});
		// TODO: add in logic to ensure there was not an error sending the email
		// 4. return message
		return {
			message: 'Success!'
		};
	},

	// c37201ec25e93f6a6e7e48a2f205fd3f0d5c654a
	async resetPassword(parent, args, ctx, info) {
		// 1. check if the passwords match
		if (args.password !== args.confirmPassword) {
			throw new Error('Passwords do not match');
		}
		// 2. retrieve user from database
		// 2a. check if the reset token is legit
		// 2b. check if the reset token expirary is not expired
		const [user] = await ctx.db.query.users({
			where: {
				resetToken: args.resetToken,
				resetTokenExpirary_gte: Date.now() - 3600000
			}
		});
		if (!user) {
			throw new Error('This token is either invalid or expired');
		}
		// 3. hash the new password
		const password = await bcrypt.hash(args.password, 10);
		// 4. save the new password to the user and remove the resetToken and resetTokenExpirary fields
		const updatedUser = await ctx.db.mutation.updateUser({
			where: { id: user.id },
			data: {
				password,
				resetToken: null,
				resetTokenExpirary: null
			}
		});
		// 5. generate JWT token
		const token = jwt.sign(
			{ userId: updatedUser.id },
			process.env.APP_SECRET
		);
		// 6. set the JWT cookie
		ctx.response.cookie('token', token, {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
		});
		// 7. return user
		return updatedUser;
	},

	async updatePermissions(parent, args, ctx, info) {
		// 1. check if user is logged in
		if (!ctx.request.userId) {
			throw new Error('Must be logged in to update permissions');
		}
		// 2. que ry the current user
		const currentUser = await ctx.db.query.user(
			{
				where: { id: ctx.request.userId }
			},
			info
		);
		// 3. check if the current user has permissions to update permissions
		hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
		// 4. update the permissions of the specified user and return the updated user
		return ctx.db.mutation.updateUser(
			{
				where: { id: args.userId },
				data: {
					permissions: {
						set: args.permissions
					}
				}
			},
			info
		);
	},

	async addToCart(parent, args, ctx, info) {
		// 1. make sure the user is logged in
		const userId = ctx.request.userId;
		if (!userId) {
			throw new Error('You must be signed in to add items to your cart.');
		}
		// 2. query the users current cart
		const [existingCartItem] = await ctx.db.query.cartItems({
			where: {
				user: { id: userId },
				item: { id: args.id }
			}
		});
		// 3. check if that item is already in the cart and increment quantity by one if it is
		if (existingCartItem) {
			return ctx.db.mutation.updateCartItem(
				{
					where: { id: existingCartItem.id },
					data: {
						quantity: existingCartItem.quantity + 1
					}
				},
				info
			);
		}
		// 4. if the item is not in the cart, create a new CartItem
		return ctx.db.mutation.createCartItem(
			{
				data: {
					item: {
						connect: { id: args.id }
					},
					user: {
						connect: { id: userId }
					}
				}
			},
			info
		);
	},

	async removeFromCart(parent, args, ctx, info) {
		// 1. find the cart item
		const cartItem = await ctx.db.query.cartItem(
			{
				where: { id: args.id }
			},
			`{
				id
				user {
					id
				}
			}`
		);
		if (!cartItem) {
			throw new Error('No cart item found');
		}
		// 2. make sure the logged in user owns that cart item
		if (cartItem.user.id !== ctx.request.userId) {
			throw new Error('You cannot remove this item from the cart');
		}
		// 3. delete the cart item
		return ctx.db.mutation.deleteCartItem(
			{
				where: { id: cartItem.id }
			},
			info
		);
	},

	async createOrder(parent, args, ctx, info) {
		// 1. query the current user and make sure they are signed in
		const { userId } = ctx.request;
		if (!userId) {
			throw new Error('You must be signed in to complete this order.');
		}
		const user = await ctx.db.query.user(
			{
				where: { id: userId }
			},
			`{
			id
			name
			email
			cart {
				id
				quantity
				item {
					id
					title
					price
					description
					image
					largeImage
				}
			}
		}`
		);
		console.log('user :', user);
		// 2. recalculate the total for the price
		const amount = user.cart.reduce(
			(total, cartItem) =>
				total + cartItem.item.price * cartItem.quantity,
			0
		);
		console.log('amount :', amount);
		// 3. create the stripe charge (turn token into $$$)
		const charge = await stripe.charges.create({
			amount,
			currency: 'USD',
			source: args.token
		});
		console.log('charge :', charge);
		if (charge.status !== 'succeeded') {
			throw new Error('Error processing credit cart.');
		}
		// 4. convert each CartItem to an OrderItem
		const orderItems = user.cart.map(cartItem => {
			const orderItem = {
				...cartItem.item,
				quantity: cartItem.quantity,
				user: {
					connect: {
						id: userId
					}
				}
			};
			delete orderItem.id;
			return orderItem;
		});
		// 5. create the Order
		const order = await ctx.db.mutation.createOrder({
			data: {
				total: charge.amount,
				charge: charge.id,
				items: {
					create: orderItems
				},
				user: {
					connect: {
						id: userId
					}
				}
			}
		});
		// 6. clean up
		// 6a. clear the user's cart
		// 6b. delete each CartItem
		const cartItemIds = user.cart.map(cartItem => cartItem.id);
		await ctx.db.mutation.deleteManyCartItems({
			where: {
				id_in: cartItemIds
			}
		});
		// 7. return the Order to the client
		return order;
	}
};

module.exports = Mutations;
