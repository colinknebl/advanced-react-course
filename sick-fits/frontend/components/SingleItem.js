import React, { Component } from 'react';
import Head from 'next/head';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import styled from 'styled-components';
import Error from './ErrorMessage';

const SingleItemStyles = styled.div`
	max-width: 1200px;
	margin: 2rem auto;
	box-shadow: ${props => props.theme.bs};
	display: grid;
	grid-auto-columns: 1fr;
	grid-auto-flow: column;
	min-height: 800px;
	img {
		height: 100%;
		width: 100%;
		object-fit: contain;
	}
	.details {
		margin: 3rem;
		font-size: 2rem;
	}
`;

const SINGLE_ITEM_QUERY = gql`
	query SINGLE_ITEM_QUERY($id: ID!) {
		item(where: { id: $id }) {
			id
			title
			description
			price
			largeImage
		}
	}
`;

class SingleItem extends Component {
	render() {
		return (
			<Query query={SINGLE_ITEM_QUERY} variables={{ id: this.props.id }}>
				{({ data, error, loading }) => {
					console.log('data', data);
					if (loading) return <p>Loading...</p>;
					if (error) return <Error error={error} />;
					if (!data.item)
						return <p>No item found for ID: {this.props.id}</p>;
					const { item } = data;
					return (
						<div>
							<Head>
								<title>Sick Fits! | {item.title}</title>
							</Head>
							<SingleItemStyles>
								<img src={item.largeImage} alt={item.title} />
								<div className="details">
									<h2>Viewing {item.title}</h2>
									<p>{item.description}</p>
								</div>
							</SingleItemStyles>
						</div>
					);
				}}
			</Query>
		);
	}
}

export default SingleItem;
