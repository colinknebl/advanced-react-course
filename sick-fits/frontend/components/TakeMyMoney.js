import React from 'react';
import StripeCheckout from 'react-stripe-checkout';
import { Mutation } from 'react-apollo';
import Router from 'next/router';
import NProgress from 'nprogress';
import gql from 'graphql-tag';
import calcTotalPrice from '../lib/calcTotalPrice';
import Error from './ErrorMessage';
import User, { CURRENT_USER_QUERY } from './User';

const CREATE_ORDER_MUTATION = gql`
	mutation CREATE_ORDER_MUTATION($token: String!) {
		createOrder(token: $token) {
			id
			charge
			total
			items {
				id
				title
			}
		}
	}
`;

function totalItems(cart) {
	return cart.reduce((tally, item) => tally + item.quantity, 0);
}

class TakeMyMoney extends React.Component {
	render() {
		return (
			<User>
				{({ data: { me } }) => (
					<Mutation
						mutation={CREATE_ORDER_MUTATION}
						refetchQueries={[{ query: CURRENT_USER_QUERY }]}
					>
						{(createOrder, { error, loading }) => (
							<StripeCheckout
								name="SickFits"
								amount={calcTotalPrice(me.cart)}
								currency="USD"
								stripeKey="pk_test_OodIOBMhdTYfJMhlCLUroplX"
								locale="en"
								token={res => this.onToken(res, createOrder)}
								description={`Order of ${totalItems(
									me.cart
								)} items`}
								image={
									me.cart.length &&
									me.cart[0].item &&
									me.cart[0].item.image
								}
								email={me.email}
							>
								{this.props.children}
							</StripeCheckout>
						)}
					</Mutation>
				)}
			</User>
		);
	}

	onToken = async (res, createOrder) => {
		NProgress.start();
		// manually call the mutation once we have the stripe token
		const order = await createOrder({
			variables: {
				token: res.id
			}
		}).catch(err => alert(err.message));
		const orderId = order.data.createOrder.id;
		Router.push(
			{
				pathname: '/order',
				query: {
					id: orderId
				}
			}
			// `item/${orderId}`
		);
	};
}

export default TakeMyMoney;
