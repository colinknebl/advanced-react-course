import React from 'react';
import Downshift, { resetIdCounter } from 'downshift';
import Router from 'next/router';
import { ApolloConsumer } from 'react-apollo';
import gql from 'graphql-tag';
import debounce from 'lodash.debounce';
import { DropDown, DropDownItem, SearchStyles } from './styles/DropDown';

const SEARCH_ITEMS_QUERY = gql`
	query SEARCH_ITEMS_QUERY($searchTerm: String!) {
		items(
			where: {
				OR: [
					{ title_contains: $searchTerm }
					{ description: $searchTerm }
				]
			}
		) {
			id
			title
			image
		}
	}
`;

function routeToItem(item) {
	Router.push(
		{
			pathname: '/item',
			query: {
				id: item.id
			}
		}
		// this is how the url will look
		// `item/${item.id}`
	);
}

class AutoComplete extends React.Component {
	state = {
		items: [],
		loading: false
	};

	render() {
		resetIdCounter();
		return (
			<SearchStyles>
				<Downshift
					itemToString={item => (item === null ? '' : item.title)}
					onChange={routeToItem}
				>
					{({
						getInputProps,
						getItemProps,
						isOpen,
						inputValue,
						highlightedIndex
					}) => (
						<div>
							<ApolloConsumer>
								{client => (
									<input
										{...getInputProps({
											type: 'search',
											placeholder: 'Search for an Item',
											id: 'search',
											className: this.state.loading
												? 'loading'
												: '',
											onChange: e => {
												e.persist();
												this.onChange(e, client);
											}
										})}
									/>
								)}
							</ApolloConsumer>
							{isOpen && (
								<DropDown>
									{this.state.items.map((item, index) => (
										<DropDownItem
											key={item.id}
											{...getItemProps({ item })}
											highlighted={
												index === highlightedIndex
											}
										>
											<img
												width="50"
												src={item.image}
												alt={item.title}
											/>
											{item.title}
										</DropDownItem>
									))}
									{!this.state.items.length &&
										!this.state.loading && (
											<DropDownItem>
												Nothing found for {inputValue}
											</DropDownItem>
										)}
								</DropDown>
							)}
						</div>
					)}
				</Downshift>
			</SearchStyles>
		);
	}

	onChange = debounce(async (e, client) => {
		// turn loading on
		this.setState({ loading: true });
		// manually query Apollo client
		const res = await client.query({
			query: SEARCH_ITEMS_QUERY,
			variables: {
				searchTerm: e.target.value
			}
		});
		this.setState({
			items: res.data.items,
			loading: false
		});
	}, 350);
}

export default AutoComplete;
