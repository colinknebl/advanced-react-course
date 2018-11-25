import PleaseSignIn from '../components/PleaseSignIn';
import OrdersList from '../components/OrdersList';

const Sell = props => (
	<div>
		<PleaseSignIn>
			<OrdersList />
		</PleaseSignIn>
	</div>
);

export default Sell;
