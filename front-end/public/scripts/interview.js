var Interview = React.createClass({

	getInitialState: function() {
		return {interviewdata: interviewdata}
	},

	render: function() {

		console.log(this.state.interviewdata['title'])

		return (
			<div>

				<section className="white minH bluetop">
					<div className="container">
						<h1>{this.state.interviewdata.title}</h1>
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
