import Link from 'next/link';
import Items from '../components/Items';

const Home = props => (
	<div>
		<Items page={props.query.page} />
	</div>
);

export default Home;
