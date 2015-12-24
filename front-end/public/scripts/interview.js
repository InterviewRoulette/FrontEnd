var Interview = React.createClass({

	getInitialState: function() {
		return {interviewdata: interviewdata}
	},

	render: function() {

		console.log(this.state.interviewdata)

		return (
			<div>
				<h1 className="skyblue mpnew">User Interviews</h1>

				<section className="white minH530">
					<div className="container">

					</div>
				</section>
			</div>
		);
	}
});



ReactDOM.render(
  <Interview />,
  document.getElementById('interview')
);
