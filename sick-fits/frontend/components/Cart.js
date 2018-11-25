import React, { Component } from 'react';
import { adopt } from 'react-adopt';
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import CartStyles from './styles/CartStyles';
import CloseButton from './styles/CloseButton';
import Supreme from './styles/Supreme';
import SickButton from './styles/SickButton';
import User from './User';
import CartItem from './CartItem';
import formatMoney from '../lib/formatMoney';
import calcTotalPrice from '../lib/calcTotalPrice';

const LOCAL_STATE_QUERY = gql`
	query LOCAL_STATE_QUERY {
		cartOpen @client
	}
`;

const TOGGLE_CART_MUTATION = gql`
	mutation {
		toggleCart @client
	}
`;

const Composed = adopt({
	user: ({ render }) => <User>{render}</User>,
	toggleCart: ({ render }) => (
		<Mutation mutation={TOGGLE_CART_MUTATION}>{render}</Mutation>
	),
	localState: ({ render }) => (
		<Query query={LOCAL_STATE_QUERY}>{render}</Query>
	)
});

const Cart = props => {
	return (
		<Composed>
			{({ user, toggleCart, localState }) => {
				const me = user.data.me;
				if (!me) return null;
				return (
					<CartStyles open={localState.data.cartOpen}>
						<header>
							<CloseButton onClick={toggleCart} title="close">
								&times;
							</CloseButton>
							<Supreme>{me.name}'s Cart</Supreme>
							<p>
								You have {me.cart.length} item
								{me.cart.length !== 1 ? 's' : null} in your cart
							</p>
						</header>
						<main>
							<ul>
								{me.cart.map(cartItem => {
									return (
										<CartItem
											key={cartItem.id}
											cartItem={cartItem}
										/>
									);
								})}
							</ul>
						</main>
						<footer>
							<p>{formatMoney(calcTotalPrice(me.cart))}</p>
							<SickButton>Checkout</SickButton>
						</footer>
					</CartStyles>
				);
			}}
		</Composed>
	);
};

export default Cart;
export { LOCAL_STATE_QUERY, TOGGLE_CART_MUTATION };
