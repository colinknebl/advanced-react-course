import React, { Component } from 'react';
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Error from './ErrorMessage';
import Table from './styles/Table';
import SickButton from './styles/SickButton';
import PropTypes from 'prop-types';

const possiblePermissions = [
	'ADMIN',
	'USER',
	'ITEMCREATE',
	'ITEMUPDATE',
	'ITEMDELETE',
	'PERMISSIONUPDATE'
];

const ALL_USERS_QUERY = gql`
	query ALL_USERS_QUERY {
		users {
			id
			name
			email
			permissions
		}
	}
`;

const UPDATE_PERMISSIONS_MUTATION = gql`
	mutation UPDATE_PERMISSIONS_MUTATION(
		$userId: ID!
		$permissions: [Permission]!
	) {
		updatePermissions(userId: $userId, permissions: $permissions) {
			id
			name
			email
			permissions
		}
	}
`;

const Permissions = props => (
	<Query query={ALL_USERS_QUERY}>
		{({ data, loading, error }) =>
			console.log(data) || (
				<div>
					<Error error={error} />
					<div>
						<h1>Manage Permissions</h1>
						<Table>
							<thead>
								<tr>
									<th>Name</th>
									<th>Email</th>
									{possiblePermissions.map(
										(permission, i) => (
											<th key={permission}>
												{permission}
											</th>
										)
									)}
									<th>👇</th>
								</tr>
							</thead>
							<tbody>
								{data.users.map(user => (
									<UserPermissions
										key={user.id}
										user={user}
									/>
								))}
							</tbody>
						</Table>
					</div>
				</div>
			)
		}
	</Query>
);

class UserPermissions extends Component {
	static propTypes = {
		user: PropTypes.shape({
			id: PropTypes.string,
			name: PropTypes.string,
			email: PropTypes.string,
			permissions: PropTypes.array
		}).isRequired
	};
	state = {
		permissions: this.props.user.permissions
	};
	render() {
		const user = this.props.user;
		return (
			<Mutation
				mutation={UPDATE_PERMISSIONS_MUTATION}
				variables={{
					...this.state,
					userId: user.id
				}}
			>
				{(updatePermissions, { error, loading }) => (
					<>
						{error && (
							<tr>
								<td colSpan="8">
									<Error error={error} />
								</td>
							</tr>
						)}
						<tr>
							<td>{user.name}</td>
							<td>{user.email}</td>
							{possiblePermissions.map((permission, i) => {
								const checked = this.state.permissions.includes(
									permission
								);
								const forId = `${
									user.id
								}-permission-${permission}`;
								return (
									<td key={permission}>
										<label htmlFor={forId}>
											<input
												id={forId}
												type="checkbox"
												checked={checked}
												value={permission}
												onChange={
													this.handlePermissionChange
												}
											/>
										</label>
									</td>
								);
							})}
							<td>
								<SickButton
									type="button"
									disabled={loading}
									onClick={updatePermissions}
								>
									Updat{loading ? 'ing' : 'e'}
								</SickButton>
							</td>
						</tr>
					</>
				)}
			</Mutation>
		);
	}

	handlePermissionChange = ({ target: checkbox }) => {
		let updatedPermissions = [...this.state.permissions];

		if (checkbox.checked) {
			updatedPermissions.push(checkbox.value);
		} else {
			updatedPermissions = updatedPermissions.filter(
				permission => permission !== checkbox.value
			);
		}
		this.setState({ permissions: updatedPermissions });
	};
}

export default Permissions;
