import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import Error from './ErrorMessage';
import { CURRENT_USER_QUERY } from './User';

const RESET_MUTATION = gql`
	mutation RESET_MUTATION(
		$resetToken: String!
		$password: String!
		$confirmPassword: String!
	) {
		resetPassword(
			resetToken: $resetToken
			password: $password
			confirmPassword: $confirmPassword
		) {
			id
			email
			name
		}
	}
`;

class Reset extends Component {
	static PropTypes = {
		resetToken: PropTypes.string.isRequired
	};
	state = {
		password: '',
		confirmPassword: ''
	};
	render() {
		return (
			<Mutation
				mutation={RESET_MUTATION}
				variables={{
					...this.state,
					resetToken: this.props.resetToken
				}}
				refetchQueries={[{ query: CURRENT_USER_QUERY }]}
			>
				{(resetPassword, { error, loading, called }) => (
					<Form
						method="POST"
						onSubmit={async event => {
							event.preventDefault();
							const response = await resetPassword();
							this.setState({
								password: '',
								confirmPassword: ''
							});
						}}
					>
						<fieldset disabled={loading} aria-busy={loading}>
							<h2>Reset Your Password</h2>
							<Error error={error} />

							{!error && !loading && called && (
								<p>Password has been successfully reset!</p>
							)}
							<label htmlFor="password">
								Password
								<input
									type="password"
									name="password"
									placeholder="password"
									value={this.state.password}
									onChange={this.saveToState}
								/>
							</label>
							<label htmlFor="confirmPassword">
								Confirm Password
								<input
									type="password"
									name="confirmPassword"
									placeholder="confirm password"
									value={this.state.confirmPassword}
									onChange={this.saveToState}
								/>
							</label>
							<button type="submit">Reset Password!</button>
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

export default Reset;
