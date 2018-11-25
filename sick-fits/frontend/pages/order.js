import PleaseSignIn from '../components/PleaseSignIn';
import OrderComponent from '../components/Order';

const Order = props => (
	<div>
		<PleaseSignIn>
			<OrderComponent orderId={props.query.id} />
		</PleaseSignIn>
	</div>
);

export default Order;
