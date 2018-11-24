import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import Error from './ErrorMessage';

const REQUEST_RESET_MUTATION = gql`
	mutation REQUEST_RESET_MUTATION($email: String!) {
		requestReset(email: $email) {
			message
		}
	}
`;

class RequestReset extends Component {
	state = {
		email: ''
	};
	render() {
		return (
			<Mutation mutation={REQUEST_RESET_MUTATION} variables={this.state}>
				{(requestReset, { error, loading, called }) => (
					<Form
						method="POST"
						onSubmit={async event => {
							event.preventDefault();
							await requestReset();
							this.setState({
								email: ''
							});
						}}
					>
						<fieldset disabled={loading} aria-busy={loading}>
							<h2>Request Password Reset</h2>
							<Error error={error} />
							{!error && !loading && called && (
								<p>
									Success! Check your email for a reset link!
								</p>
							)}
							<label htmlFor="email">
								Email
								<input
									type="email"
									name="email"
									placeholder="email"
									value={this.state.email}
									onChange={this.saveToState}
								/>
							</label>
							<button type="submit">Request Reset!</button>
						</fieldset>
					</Form>
				)}
			</Mutation>
		);
	}
	saveToState = event => {
		event.preventDefault();
		const { value, name } = event.target;
		this.setState({ [name]: value });
	};
}

export default RequestReset;
